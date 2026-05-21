"use server";

import { eq, like, and, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { cases, notDeleted } from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import type { ActionResult } from "@/lib/auth-types";
import { caseSchema, type CaseInput } from "@/lib/case-constants";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ============================================================
// List cases with search and filter
// ============================================================
export async function getCases({
  search = "",
  status = "",
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<ActionResult<{ items: (typeof cases.$inferSelect)[]; total: number }>> {
  await requireAuth();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [notDeleted(cases)];

    if (status) {
      conditions.push(eq(cases.status, status));
    }

    if (search) {
      conditions.push(
        or(
          like(cases.court_case_number, `%${search}%`),
          like(cases.firm_case_number, `%${search}%`),
          like(cases.case_type, `%${search}%`)
        )
      );
    }

    const where = and(...conditions);

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(cases)
        .where(where)
        .orderBy(cases.updated_at)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.$count(cases, where),
    ]);

    return { success: true, data: { items, total: countResult } };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Get single case
// ============================================================
export async function getCase(
  id: number
): Promise<ActionResult<(typeof cases.$inferSelect) | null>> {
  await requireAuth();

  try {
    const result = await db
      .select()
      .from(cases)
      .where(and(eq(cases.id, id), notDeleted(cases)))
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: "案件不存在" };
    }

    return { success: true, data: result[0] };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Create case
// ============================================================
export async function createCase(
  input: CaseInput
): Promise<ActionResult<typeof cases.$inferSelect>> {
  await requireAuth();

  try {
    const parsed = caseSchema.parse(input);

    const result = await db.insert(cases).values(parsed).returning();
    revalidatePath("/cases");
    return { success: true, data: result[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.message || "校验失败" };
    }
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Update case
// ============================================================
export async function updateCase(
  id: number,
  input: CaseInput
): Promise<ActionResult<typeof cases.$inferSelect>> {
  await requireAuth();

  try {
    const parsed = caseSchema.parse(input);

    const result = await db
      .update(cases)
      .set({ ...parsed, updated_at: new Date().toISOString() })
      .where(and(eq(cases.id, id), notDeleted(cases)))
      .returning();

    if (result.length === 0) {
      return { success: false, error: "案件不存在" };
    }

    revalidatePath("/cases");
    revalidatePath(`/cases/${id}`);
    return { success: true, data: result[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.message || "校验失败" };
    }
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Soft delete case
// ============================================================
export async function deleteCase(
  id: number
): Promise<ActionResult> {
  await requireAuth();

  try {
    const result = await db
      .update(cases)
      .set({ deleted_at: new Date().toISOString() })
      .where(and(eq(cases.id, id), notDeleted(cases)))
      .returning({ id: cases.id });

    if (result.length === 0) {
      return { success: false, error: "案件不存在" };
    }

    revalidatePath("/cases");
    return { success: true };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}
