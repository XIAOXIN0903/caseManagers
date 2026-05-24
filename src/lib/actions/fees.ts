"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { feeRecords } from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import type { ActionResult } from "@/lib/auth-types";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const feeSchema = z.object({
  payment_status: z.string().optional().default("未收"),
  is_deposited: z.number().optional().default(0),
  amount: z.number().optional().default(0),
  invoice_url: z.string().optional().default(""),
  received_date: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

// ============================================================
// List fee records for a case
// ============================================================
export async function getFees(
  caseId: number
): Promise<ActionResult<(typeof feeRecords.$inferSelect)[]>> {
  await requireAuth();
  try {
    const result = await db
      .select()
      .from(feeRecords)
      .where(eq(feeRecords.case_id, caseId))
      .orderBy(feeRecords.created_at);
    return { success: true, data: result };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Create fee record
// ============================================================
export async function createFee(
  caseId: number,
  input: z.infer<typeof feeSchema>
): Promise<ActionResult<typeof feeRecords.$inferSelect>> {
  await requireAuth();
  try {
    const parsed = feeSchema.parse(input);
    const result = await db
      .insert(feeRecords)
      .values({ case_id: caseId, ...parsed })
      .returning();
    revalidatePath(`/cases/${caseId}`);
    revalidatePath("/dashboard");
    return { success: true, data: result[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.message || "校验失败" };
    }
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Update fee record
// ============================================================
export async function updateFee(
  id: number,
  caseId: number,
  input: z.infer<typeof feeSchema>
): Promise<ActionResult<typeof feeRecords.$inferSelect>> {
  await requireAuth();
  try {
    const parsed = feeSchema.parse(input);
    const result = await db
      .update(feeRecords)
      .set(parsed)
      .where(eq(feeRecords.id, id))
      .returning();
    if (result.length === 0) return { success: false, error: "记录不存在" };
    revalidatePath(`/cases/${caseId}`);
    revalidatePath("/dashboard");
    return { success: true, data: result[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.message || "校验失败" };
    }
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Delete fee record (hard delete)
// ============================================================
export async function deleteFee(
  id: number,
  caseId: number
): Promise<ActionResult> {
  await requireAuth();
  try {
    await db.delete(feeRecords).where(eq(feeRecords.id, id));
    revalidatePath(`/cases/${caseId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}
