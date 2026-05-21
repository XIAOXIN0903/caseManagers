"use server";

import { eq, and, like, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { parties, cases, notDeleted } from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import type { ActionResult } from "@/lib/auth-types";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { LITIGATION_STATUSES } from "@/lib/case-constants";

const partySchema = z.object({
  name: z.string().min(1, "当事人姓名必填"),
  litigation_status: z.string().min(1, "诉讼地位必填"),
  phone: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

// ============================================================
// List parties for a case
// ============================================================
export async function getParties(
  caseId: number
): Promise<ActionResult<(typeof parties.$inferSelect)[]>> {
  await requireAuth();
  try {
    const result = await db
      .select()
      .from(parties)
      .where(and(eq(parties.case_id, caseId), notDeleted(parties)));
    return { success: true, data: result };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Create party
// ============================================================
export async function createParty(
  caseId: number,
  input: z.infer<typeof partySchema>
): Promise<ActionResult<typeof parties.$inferSelect>> {
  await requireAuth();
  try {
    const parsed = partySchema.parse(input);
    const result = await db
      .insert(parties)
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
// Update party
// ============================================================
export async function updateParty(
  id: number,
  caseId: number,
  input: z.infer<typeof partySchema>
): Promise<ActionResult<typeof parties.$inferSelect>> {
  await requireAuth();
  try {
    const parsed = partySchema.parse(input);
    const result = await db
      .update(parties)
      .set(parsed)
      .where(and(eq(parties.id, id), notDeleted(parties)))
      .returning();

    if (result.length === 0) return { success: false, error: "当事人不存在" };

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
// Soft delete party
// ============================================================
export async function deleteParty(
  id: number,
  caseId: number
): Promise<ActionResult> {
  await requireAuth();
  try {
    const result = await db
      .update(parties)
      .set({ deleted_at: new Date().toISOString() })
      .where(and(eq(parties.id, id), notDeleted(parties)))
      .returning({ id: parties.id });

    if (result.length === 0) return { success: false, error: "当事人不存在" };

    revalidatePath(`/cases/${caseId}`);
    return { success: true };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Conflict check — search for parties with same name in other cases
// ============================================================
export type ConflictResult = {
  party_name: string;
  case_ids: number[];
  case_numbers: string[];
  statuses: string[];
};

export async function checkConflict(
  name: string,
  excludeCaseId: number
): Promise<ActionResult<ConflictResult | null>> {
  await requireAuth();
  try {
    const matches = await db
      .select({
        party: parties,
        relatedCase: cases,
      })
      .from(parties)
      .innerJoin(cases, eq(parties.case_id, cases.id))
      .where(
        and(
          like(parties.name, `%${name}%`),
          ne(parties.case_id, excludeCaseId),
          notDeleted(parties),
          notDeleted(cases)
        )
      );

    if (matches.length === 0) return { success: true, data: null };

    return {
      success: true,
      data: {
        party_name: name,
        case_ids: [...new Set(matches.map((m) => m.relatedCase.id))],
        case_numbers: [...new Set(matches.map((m) => m.relatedCase.court_case_number || ""))].filter(Boolean),
        statuses: [...new Set(matches.map((m) => m.party.litigation_status || ""))].filter(Boolean),
      },
    };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}
