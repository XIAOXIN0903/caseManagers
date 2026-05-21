"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { communicationLogs, notDeleted } from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import type { ActionResult } from "@/lib/auth-types";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { COMM_METHODS } from "@/lib/case-constants";

const communicationSchema = z.object({
  communication_date: z.string().min(1, "日期必填"),
  method: z.string().optional().default("电话"),
  contact_person: z.string().optional().default(""),
  summary: z.string().optional().default(""),
});

// ============================================================
// List communication logs for a case
// ============================================================
export async function getCommunications(
  caseId: number
): Promise<ActionResult<(typeof communicationLogs.$inferSelect)[]>> {
  await requireAuth();
  try {
    const result = await db
      .select()
      .from(communicationLogs)
      .where(
        and(eq(communicationLogs.case_id, caseId), notDeleted(communicationLogs))
      )
      .orderBy(communicationLogs.communication_date);
    return { success: true, data: result };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Create communication log
// ============================================================
export async function createCommunication(
  caseId: number,
  input: z.infer<typeof communicationSchema>
): Promise<ActionResult<typeof communicationLogs.$inferSelect>> {
  await requireAuth();
  try {
    const parsed = communicationSchema.parse(input);
    const result = await db
      .insert(communicationLogs)
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
// Update communication log
// ============================================================
export async function updateCommunication(
  id: number,
  caseId: number,
  input: z.infer<typeof communicationSchema>
): Promise<ActionResult<typeof communicationLogs.$inferSelect>> {
  await requireAuth();
  try {
    const parsed = communicationSchema.parse(input);
    const result = await db
      .update(communicationLogs)
      .set(parsed)
      .where(and(eq(communicationLogs.id, id), notDeleted(communicationLogs)))
      .returning();
    if (result.length === 0) return { success: false, error: "记录不存在" };
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
// Soft delete communication log
// ============================================================
export async function deleteCommunication(
  id: number,
  caseId: number
): Promise<ActionResult> {
  await requireAuth();
  try {
    await db
      .update(communicationLogs)
      .set({ deleted_at: new Date().toISOString() })
      .where(and(eq(communicationLogs.id, id), notDeleted(communicationLogs)));
    revalidatePath(`/cases/${caseId}`);
    return { success: true };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}
