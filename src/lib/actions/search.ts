"use server";

import { eq, and, like, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { cases, parties, notDeleted } from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import type { ActionResult } from "@/lib/auth-types";

export type GlobalSearchResult = {
  cases: (typeof cases.$inferSelect)[];
  parties: Array<{
    id: number;
    name: string;
    litigation_status: string | null;
    case_id: number;
    court_case_number: string | null;
  }>;
};

export async function globalSearch(
  query: string
): Promise<ActionResult<GlobalSearchResult>> {
  await requireAuth();

  if (!query || query.trim().length < 1) {
    return { success: false, error: "请输入搜索关键词" };
  }

  const q = `%${query.trim()}%`;

  try {
    const [caseResults, partyResults] = await Promise.all([
      db
        .select()
        .from(cases)
        .where(
          and(
            notDeleted(cases),
            or(
              like(cases.court_case_number, q),
              like(cases.firm_case_number, q),
              like(cases.case_type, q),
              like(cases.court_name, q),
              like(cases.description, q)
            )
          )
        )
        .orderBy(cases.updated_at)
        .limit(20),

      db
        .select({
          id: parties.id,
          name: parties.name,
          litigation_status: parties.litigation_status,
          case_id: parties.case_id,
          court_case_number: cases.court_case_number,
        })
        .from(parties)
        .innerJoin(cases, eq(parties.case_id, cases.id))
        .where(
          and(
            notDeleted(parties),
            notDeleted(cases),
            like(parties.name, q)
          )
        )
        .limit(20),
    ]);

    return {
      success: true,
      data: {
        cases: caseResults,
        parties: partyResults,
      },
    };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}
