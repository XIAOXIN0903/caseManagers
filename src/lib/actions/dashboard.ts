"use server";

import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  cases,
  reminders,
  feeRecords,
  notDeleted,
} from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import type { ActionResult } from "@/lib/auth-types";

export type DashboardData = {
  upcomingCourts: Array<{ title: string; date: string; caseId: number; caseNumber: string }>;
  pendingReminders: number;
  overdueReminders: number;
  recentCases: (typeof cases.$inferSelect)[];
  totalReceived: number;
  totalPending: number;
  activeCasesCount: number;
};

export async function getDashboardData(): Promise<ActionResult<DashboardData>> {
  await requireAuth();

  try {
    const today = new Date().toISOString().split("T")[0];
    const threeDaysFromNow = new Date(Date.now() + 3 * 86400000)
      .toISOString()
      .split("T")[0];

    // Upcoming court reminders (next 5)
    const upcomingCourtResult = await db
      .select({
        title: reminders.title,
        date: reminders.reminder_date,
        caseId: cases.id,
        caseNumber: cases.court_case_number,
      })
      .from(reminders)
      .innerJoin(cases, eq(reminders.case_id, cases.id))
      .where(
        and(
          eq(reminders.reminder_type, "开庭"),
          eq(reminders.is_completed, 0),
          gte(reminders.reminder_date, today),
          notDeleted(reminders),
          notDeleted(cases)
        )
      )
      .orderBy(reminders.reminder_date)
      .limit(5);

    // Pending reminders count
    const [pendingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reminders)
      .where(
        and(
          eq(reminders.is_completed, 0),
          gte(reminders.reminder_date, today),
          notDeleted(reminders)
        )
      );

    // Overdue reminders (expired or within 3 days)
    const [overdueResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reminders)
      .where(
        and(
          eq(reminders.is_completed, 0),
          lte(reminders.reminder_date, threeDaysFromNow),
          notDeleted(reminders)
        )
      );

    // Recent cases
    const recentCasesResult = await db
      .select()
      .from(cases)
      .where(notDeleted(cases))
      .orderBy(cases.updated_at)
      .limit(5);

    // Fee summary — only for non-deleted cases
    const allFees = await db
      .select({
        amount: feeRecords.amount,
        payment_status: feeRecords.payment_status,
      })
      .from(feeRecords)
      .innerJoin(cases, eq(feeRecords.case_id, cases.id))
      .where(notDeleted(cases));

    const totalReceived = allFees
      .filter((f) => f.payment_status === "已收")
      .reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalPending = allFees
      .filter((f) => f.payment_status === "未收")
      .reduce((sum, f) => sum + (f.amount || 0), 0);

    // Active cases count
    const [activeResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cases)
      .where(
        and(
          notDeleted(cases),
          sql`${cases.status} != '结案'`
        )
      );

    return {
      success: true,
      data: {
        upcomingCourts: upcomingCourtResult.map((r) => ({
          title: r.title || "开庭",
          date: r.date || "",
          caseId: r.caseId,
          caseNumber: r.caseNumber || "",
        })),
        pendingReminders: pendingResult?.count || 0,
        overdueReminders: overdueResult?.count || 0,
        recentCases: recentCasesResult,
        totalReceived,
        totalPending,
        activeCasesCount: activeResult?.count || 0,
      },
    };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}
