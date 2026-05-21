"use server";

import { isNull, not } from "drizzle-orm";
import { db } from "@/lib/db";
import { cases, parties, reminders, communicationLogs } from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import type { ActionResult } from "@/lib/auth-types";
import { revalidatePath } from "next/cache";

export type DeletedItem = {
  id: number;
  table: string;
  label: string;
  deleted_at: string | null;
  case_id?: number | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tableConfigs: Array<{
  table: any;
  name: string;
  labelField: string;
}> = [
  { table: cases, name: "cases", labelField: "court_case_number" },
  { table: parties, name: "parties", labelField: "name" },
  { table: reminders, name: "reminders", labelField: "title" },
  { table: communicationLogs, name: "communication_logs", labelField: "summary" },
];

export async function getDeletedItems(): Promise<ActionResult<DeletedItem[]>> {
  await requireAuth();
  try {
    const results: DeletedItem[] = [];

    for (const config of tableConfigs) {
      const rows = await db
        .select()
        .from(config.table)
        .where(not(isNull(config.table.deleted_at)));

      for (const row of rows) {
        const rowData = row as Record<string, unknown>;
        const caseId = (rowData["case_id"] as number) || null;
        results.push({
          id: rowData["id"] as number,
          table: config.name,
          label: (rowData[config.labelField] as string) || `ID: ${rowData["id"]}`,
          deleted_at: (rowData["deleted_at"] as string) || null,
          case_id: caseId,
        });
      }
    }

    return { success: true, data: results };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

export async function restoreItem(
  table: string,
  id: number
): Promise<ActionResult> {
  await requireAuth();
  try {
    const config = tableConfigs.find((c) => c.name === table);
    if (!config) return { success: false, error: "未知表名" };

    await db
      .update(config.table)
      .set({ deleted_at: null } as never)
      .where(
        not(isNull(config.table.deleted_at))
      ) as never;

    // More precise: update where id matches
    // Since drizzle doesn't support dynamic table references easily, use raw SQL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyDb = db as any;
    await anyDb.run(
      `UPDATE ${table} SET deleted_at = NULL WHERE id = ?`,
      [id]
    );

    revalidatePath("/recycle-bin");
    return { success: true };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

export async function permanentDelete(
  table: string,
  id: number
): Promise<ActionResult> {
  await requireAuth();
  try {
    const config = tableConfigs.find((c) => c.name === table);
    if (!config) return { success: false, error: "未知表名" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyDb = db as any;
    await anyDb.run(`DELETE FROM ${table} WHERE id = ?`, [id]);

    revalidatePath("/recycle-bin");
    return { success: true };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}
