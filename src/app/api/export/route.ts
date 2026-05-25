import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cases, notDeleted } from "@/lib/schema";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const format = searchParams.get("format") || "xlsx";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [notDeleted(cases)];

    if (status) {
      const { eq } = await import("drizzle-orm");
      conditions.push(eq(cases.status, status));
    }

    if (search) {
      const { or, like } = await import("drizzle-orm");
      conditions.push(
        or(
          like(cases.court_case_number, `%${search}%`),
          like(cases.firm_case_number, `%${search}%`),
          like(cases.case_type, `%${search}%`)
        )
      );
    }

    const { and } = await import("drizzle-orm");
    const items = await db
      .select()
      .from(cases)
      .where(and(...conditions))
      .orderBy(cases.updated_at);

    const rows = items.map((c) => ({
      "法院案号": c.court_case_number,
      "律所管理号": c.firm_case_number,
      "案由": c.case_type,
      "受理法院": c.court_name,
      "主审法官": c.presiding_judge,
      "案件状态": c.status,
      "标的额": c.claim_amount,
      "立案日期": c.filing_date,
      "对方律师": c.opposing_counsel,
      "对方律所": c.opposing_firm,
      "创建时间": c.created_at,
    }));

    if (format === "csv") {
      const csvContent =
        Object.keys(rows[0] || {}).join(",") +
        "\n" +
        rows
          .map((r) =>
            Object.values(r)
              .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
              .join(",")
          )
          .join("\n");

      const csvFilename = `案件列表_${new Date().toISOString().split("T")[0]}.csv`;
      return new NextResponse("﻿" + csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(csvFilename)}`,
        },
      });
    }

    // Excel
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "案件列表");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`案件列表_${new Date().toISOString().split("T")[0]}.xlsx`)}`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, error: "导出失败" },
      { status: 500 }
    );
  }
}
