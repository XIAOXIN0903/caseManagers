"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { caseProgress } from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import type { ActionResult } from "@/lib/auth-types";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { EVENT_TYPES } from "@/lib/case-constants";

const progressSchema = z.object({
  event_type: z.string().min(1, "事件类型必填"),
  event_date: z.string().min(1, "日期必填"),
  description: z.string().optional().default(""),
});

// ============================================================
// List progress for a case
// ============================================================
export async function getProgress(
  caseId: number
): Promise<ActionResult<(typeof caseProgress.$inferSelect)[]>> {
  await requireAuth();
  try {
    const result = await db
      .select()
      .from(caseProgress)
      .where(eq(caseProgress.case_id, caseId))
      .orderBy(caseProgress.event_date);
    return { success: true, data: result };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Create progress
// ============================================================
export async function createProgress(
  caseId: number,
  input: z.infer<typeof progressSchema>
): Promise<ActionResult<typeof caseProgress.$inferSelect>> {
  await requireAuth();
  try {
    const parsed = progressSchema.parse(input);
    const result = await db
      .insert(caseProgress)
      .values({ case_id: caseId, ...parsed })
      .returning();
    revalidatePath(`/cases/${caseId}`);
    return { success: true, data: result[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.message || "校验失败" };
    }
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Delete progress (hard delete, no soft delete for progress)
// ============================================================
export async function deleteProgress(
  id: number,
  caseId: number
): Promise<ActionResult> {
  await requireAuth();
  try {
    await db.delete(caseProgress).where(eq(caseProgress.id, id));
    revalidatePath(`/cases/${caseId}`);
    return { success: true };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}
