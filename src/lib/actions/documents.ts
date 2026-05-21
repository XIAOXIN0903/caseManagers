"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents } from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import type { ActionResult } from "@/lib/auth-types";
import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import path from "path";

import { DOC_CATEGORIES } from "@/lib/case-constants";

// ============================================================
// List documents for a case
// ============================================================
export async function getDocuments(
  caseId: number
): Promise<ActionResult<(typeof documents.$inferSelect)[]>> {
  await requireAuth();
  try {
    const result = await db
      .select()
      .from(documents)
      .where(eq(documents.case_id, caseId))
      .orderBy(documents.created_at);
    return { success: true, data: result };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Add document record
// ============================================================
export async function addDocument(
  caseId: number,
  input: {
    category: string;
    subcategory?: string;
    file_name: string;
    file_url: string;
    file_size?: number;
    file_type?: string;
  }
): Promise<ActionResult<typeof documents.$inferSelect>> {
  await requireAuth();
  try {
    const result = await db
      .insert(documents)
      .values({ case_id: caseId, ...input })
      .returning();
    revalidatePath(`/cases/${caseId}`);
    return { success: true, data: result[0] };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}

// ============================================================
// Delete document (hard delete + remove file)
// ============================================================
export async function deleteDocument(
  id: number,
  caseId: number
): Promise<ActionResult> {
  await requireAuth();
  try {
    const record = await db
      .select({ file_url: documents.file_url })
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (record.length > 0) {
      const filePath = path.join(
        process.cwd(),
        "public",
        record[0].file_url || ""
      );
      // Try to delete file, ignore if not found
      try {
        await unlink(filePath);
      } catch {
        // file may not exist, ignore
      }
    }

    await db.delete(documents).where(eq(documents.id, id));
    revalidatePath(`/cases/${caseId}`);
    return { success: true };
  } catch {
    return { success: false, error: "操作失败，请重试" };
  }
}
