"use server";

import { eq, and, lte, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { reminders, cases, notDeleted } from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import type { ActionResult } from "@/lib/auth-types";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { REMINDER_TYPES } from "@/lib/case-constants";

const reminderSchema = z.object({
  title: z.string().min(1, "标题必填"),
  reminder_date: z.string().min(1, "日期必填"),
  reminder_type: z.string().optional().default("自定义"),
  is_completed: z.number().optional().default(0),
  notes: z.string().optional().default(""),
  case_id: z.number().nullable().optional().default(null),
});

// ============================================================
// List reminders for a case
// ============================================================
export async function getReminders(
  caseId: number
): Promise<ActionResult<(typeof reminders.$inferSelect)[]>> {
  await requireAuth();
  try {
    const result = await db
      .select()
      .from(reminders)
      .where(and(eq(reminders.case_id, caseId), notDeleted(reminders)))
      .orderBy(reminders.reminder_date);
    return { success: true, data: result };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Create reminder
// ============================================================
export async function createReminder(
  caseId: number,
  input: z.infer<typeof reminderSchema>
): Promise<ActionResult<typeof reminders.$inferSelect>> {
  await requireAuth();
  try {
    const parsed = reminderSchema.parse(input);
    const { case_id: _, ...rest } = parsed;
    const result = await db
      .insert(reminders)
      .values({ case_id: caseId, ...rest })
      .returning();
    revalidatePath(`/cases/${caseId}`);
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
    return { success: true, data: result[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.message || "校验失败" };
    }
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Update reminder
// ============================================================
export async function updateReminder(
  id: number,
  caseId: number,
  input: z.infer<typeof reminderSchema>
): Promise<ActionResult<typeof reminders.$inferSelect>> {
  await requireAuth();
  try {
    const parsed = reminderSchema.parse(input);
    const { case_id: _, ...rest } = parsed;
    const result = await db
      .update(reminders)
      .set(rest)
      .where(and(eq(reminders.id, id), notDeleted(reminders)))
      .returning();
    if (result.length === 0) return { success: false, error: "提醒不存在" };
    revalidatePath(`/cases/${caseId}`);
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
    return { success: true, data: result[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.message || "校验失败" };
    }
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Toggle completion
// ============================================================
export async function toggleReminder(
  id: number,
  caseId: number
): Promise<ActionResult> {
  await requireAuth();
  try {
    const existing = await db
      .select({ is_completed: reminders.is_completed })
      .from(reminders)
      .where(and(eq(reminders.id, id), notDeleted(reminders)))
      .limit(1);

    if (existing.length === 0) return { success: false, error: "提醒不存在" };

    const newValue = existing[0].is_completed === 1 ? 0 : 1;
    await db
      .update(reminders)
      .set({ is_completed: newValue })
      .where(eq(reminders.id, id));

    revalidatePath(`/cases/${caseId}`);
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
    return { success: true };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Soft delete reminder
// ============================================================
export async function deleteReminder(
  id: number,
  caseId: number
): Promise<ActionResult> {
  await requireAuth();
  try {
    await db
      .update(reminders)
      .set({ deleted_at: new Date().toISOString() })
      .where(and(eq(reminders.id, id), notDeleted(reminders)));
    revalidatePath(`/cases/${caseId}`);
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
    return { success: true };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Standalone reminder (no case)
// ============================================================
export async function createStandaloneReminder(
  input: { title: string; reminder_date: string; reminder_type?: string; notes?: string }
): Promise<ActionResult<typeof reminders.$inferSelect>> {
  await requireAuth();
  try {
    const result = await db
      .insert(reminders)
      .values({
        case_id: null,
        title: input.title,
        reminder_date: input.reminder_date,
        reminder_type: input.reminder_type || "自定义",
        notes: input.notes || "",
      })
      .returning();
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    return { success: true, data: result[0] };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

export async function updateStandaloneReminder(
  id: number,
  input: { title: string; reminder_date: string; reminder_type?: string; notes?: string; is_completed?: number }
): Promise<ActionResult<typeof reminders.$inferSelect>> {
  await requireAuth();
  try {
    const result = await db
      .update(reminders)
      .set(input)
      .where(and(eq(reminders.id, id), notDeleted(reminders)))
      .returning();
    if (result.length === 0) return { success: false, error: "提醒不存在" };
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    return { success: true, data: result[0] };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

export async function deleteStandaloneReminder(id: number): Promise<ActionResult> {
  await requireAuth();
  try {
    await db
      .update(reminders)
      .set({ deleted_at: new Date().toISOString() })
      .where(and(eq(reminders.id, id), notDeleted(reminders)));
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Upcoming reminders (for dashboard and calendar)
// ============================================================
export async function getUpcomingReminders(limitCount = 5) {
  await requireAuth();
  try {
    const today = new Date().toISOString().split("T")[0];
    const result = await db
      .select({
        reminder: reminders,
        case_court_number: cases.court_case_number,
      })
      .from(reminders)
      .leftJoin(cases, eq(reminders.case_id, cases.id))
      .where(
        and(
          gte(reminders.reminder_date, today),
          eq(reminders.is_completed, 0),
          notDeleted(reminders)
        )
      )
      .orderBy(reminders.reminder_date)
      .limit(limitCount);
    return { success: true, data: result };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

export async function getOverdueReminders() {
  await requireAuth();
  try {
    const today = new Date().toISOString().split("T")[0];
    const threeDaysFromNow = new Date(Date.now() + 3 * 86400000)
      .toISOString()
      .split("T")[0];

    const result = await db
      .select({
        reminder: reminders,
        case_court_number: cases.court_case_number,
      })
      .from(reminders)
      .leftJoin(cases, eq(reminders.case_id, cases.id))
      .where(
        and(
          lte(reminders.reminder_date, threeDaysFromNow),
          eq(reminders.is_completed, 0),
          notDeleted(reminders)
        )
      )
      .orderBy(reminders.reminder_date);

    return { success: true, data: result };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

export async function getRemindersForMonth(year: number, month: number) {
  await requireAuth();
  try {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate =
      month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const result = await db
      .select({
        reminder: reminders,
        case_court_number: cases.court_case_number,
      })
      .from(reminders)
      .leftJoin(cases, eq(reminders.case_id, cases.id))
      .where(
        and(
          gte(reminders.reminder_date, startDate),
          lte(reminders.reminder_date, endDate),
          notDeleted(reminders)
        )
      )
      .orderBy(reminders.reminder_date);

    return { success: true, data: result };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}
