import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cases, parties } from "@/lib/schema";
import { verifyToken } from "@/lib/auth";
import * as XLSX from "xlsx";
import { eq, isNull } from "drizzle-orm";

const CASE_STATUSES = [
  "立案", "审理", "一审判决", "二审判决", "再审",
  "执行", "调解", "撤诉", "结案", "已结委托",
];
const LITIGATION_STATUSES = [
  "原告", "被告", "反诉原告", "反诉被告", "第三人",
  "申请人", "被申请人", "上诉人", "被上诉人",
  "申请执行人", "被执行人",
];

interface ImportRow {
  court_case_number: string;
  firm_case_number: string;
  case_type: string;
  court_name: string;
  presiding_judge: string;
  judge_phone: string;
  judge_assistant: string;
  assistant_phone: string;
  filing_date: string;
  status: string;
  claim_amount: number;
  our_party: string;
  opposing_party: string;
  opposing_counsel: string;
  opposing_firm: string;
  opposing_phone: string;
  description: string;
  party_name: string;
  party_status: string;
  party_phone: string;
  party_notes: string;
}

export async function POST(request: NextRequest) {
  // Auth check
  const payload = await verifyToken();
  if (!payload) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: "请上传文件" }, { status: 400 });
    }

    // Parse Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ success: false, error: "Excel 文件中没有工作表" }, { status: 400 });
    }

    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[];

    if (rawData.length === 0) {
      return NextResponse.json({ success: false, error: "Excel 文件中没有数据" }, { status: 400 });
    }

    // Column name mapping (support both Chinese headers)
    const colMap: Record<string, string> = {
      "法院案号": "court_case_number",
      "律所管理号": "firm_case_number",
      "案由": "case_type",
      "受理法院": "court_name",
      "主审法官": "presiding_judge",
      "法官电话": "judge_phone",
      "法官助理": "judge_assistant",
      "助理电话": "assistant_phone",
      "立案日期": "filing_date",
      "案件状态": "status",
      "标的额": "claim_amount",
      "我方当事人": "our_party",
      "对方当事人": "opposing_party",
      "对方律师": "opposing_counsel",
      "对方律所": "opposing_firm",
      "对方电话": "opposing_phone",
      "案件描述": "description",
      "当事人姓名": "party_name",
      "诉讼地位": "party_status",
      "当事人电话": "party_phone",
      "当事人备注": "party_notes",
    };

    // Map rows
    const rows: ImportRow[] = rawData.map((raw) => {
      const row: Record<string, unknown> = {};
      for (const [cnKey, enKey] of Object.entries(colMap)) {
        row[enKey] = raw[cnKey] ?? "";
      }
      return row as unknown as ImportRow;
    });

    // Validate and filter
    const errors: { row: number; message: string }[] = [];
    const validRows: { index: number; data: ImportRow }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is header, Excel is 1-indexed

      // Trim strings
      const courtNum = String(row.court_case_number || "").trim();
      const firmNum = String(row.firm_case_number || "").trim();

      if (!courtNum) {
        errors.push({ row: rowNum, message: "法院案号为空" });
        continue;
      }
      if (!firmNum) {
        errors.push({ row: rowNum, message: "律所管理号为空" });
        continue;
      }

      const status = String(row.status || "").trim() || "立案";
      if (!CASE_STATUSES.includes(status)) {
        errors.push({ row: rowNum, message: `案件状态"${status}"不在有效值范围内：${CASE_STATUSES.join("、")}` });
        continue;
      }

      const partyStatus = String(row.party_status || "").trim();
      if (partyStatus && !LITIGATION_STATUSES.includes(partyStatus)) {
        errors.push({ row: rowNum, message: `诉讼地位"${partyStatus}"不在有效值范围内：${LITIGATION_STATUSES.join("、")}` });
        continue;
      }

      let claimAmount = 0;
      const rawAmount: unknown = row.claim_amount;
      if (rawAmount != null && rawAmount !== "" && rawAmount !== 0) {
        claimAmount = Number(rawAmount);
        if (isNaN(claimAmount)) {
          errors.push({ row: rowNum, message: `标的额"${rawAmount}"不是有效数字` });
          continue;
        }
      }

      validRows.push({
        index: i,
        data: {
          court_case_number: courtNum,
          firm_case_number: firmNum,
          case_type: String(row.case_type || "").trim(),
          court_name: String(row.court_name || "").trim(),
          presiding_judge: String(row.presiding_judge || "").trim(),
          judge_phone: String(row.judge_phone || "").trim(),
          judge_assistant: String(row.judge_assistant || "").trim(),
          assistant_phone: String(row.assistant_phone || "").trim(),
          filing_date: String(row.filing_date || "").trim(),
          status,
          claim_amount: claimAmount,
          our_party: String(row.our_party || "").trim(),
          opposing_party: String(row.opposing_party || "").trim(),
          opposing_counsel: String(row.opposing_counsel || "").trim(),
          opposing_firm: String(row.opposing_firm || "").trim(),
          opposing_phone: String(row.opposing_phone || "").trim(),
          description: String(row.description || "").trim(),
          party_name: String(row.party_name || "").trim(),
          party_status: partyStatus,
          party_phone: String(row.party_phone || "").trim(),
          party_notes: String(row.party_notes || "").trim(),
        },
      });
    }

    if (validRows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "没有有效数据可导入",
        details: { total: rows.length, imported: 0, errors },
      });
    }

    // Check duplicates within the file (only court_case_number must be unique)
    const seenCourt: Set<string> = new Set();
    const withinFileCourtDups = new Set<number>();

    for (const vr of validRows) {
      if (seenCourt.has(vr.data.court_case_number)) {
        withinFileCourtDups.add(vr.index);
      }
      seenCourt.add(vr.data.court_case_number);
    }

    // Check duplicates in database (only court_case_number must be unique)
    const dbDuplicates = await db
      .select({
        court_case_number: cases.court_case_number,
      })
      .from(cases)
      .where(isNull(cases.deleted_at));

    const dbCourtSet = new Set(
      dbDuplicates.map((d) => d.court_case_number).filter(Boolean) as string[]
    );

    // Filter out rows that have DB conflicts or file-internal duplicates
    const finalRows = validRows.filter((vr) => {
      if (dbCourtSet.has(vr.data.court_case_number)) {
        errors.push({
          row: vr.index + 2,
          message: `法院案号"${vr.data.court_case_number}"已存在`,
        });
        return false;
      }
      if (withinFileCourtDups.has(vr.index)) {
        errors.push({
          row: vr.index + 2,
          message: `法院案号"${vr.data.court_case_number}"在导入文件中重复`,
        });
        return false;
      }
      return true;
    });

    if (finalRows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "所有数据均因重复或校验失败而跳过",
        details: { total: rows.length, imported: 0, errors },
      });
    }

    // Insert in a single transaction using raw SQL for efficiency
    let imported = 0;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    try {
      // Build batch INSERT for cases
      for (const vr of finalRows) {
        const d = vr.data;
        const result = await db
          .insert(cases)
          .values({
            court_case_number: d.court_case_number,
            firm_case_number: d.firm_case_number,
            case_type: d.case_type || null,
            court_name: d.court_name || null,
            presiding_judge: d.presiding_judge || null,
            judge_phone: d.judge_phone || null,
            judge_assistant: d.judge_assistant || null,
            assistant_phone: d.assistant_phone || null,
            filing_date: d.filing_date || null,
            status: d.status,
            claim_amount: d.claim_amount || 0,
            our_party: d.our_party || null,
            opposing_party: d.opposing_party || null,
            opposing_counsel: d.opposing_counsel || null,
            opposing_firm: d.opposing_firm || null,
            opposing_phone: d.opposing_phone || null,
            description: d.description || null,
          })
          .returning({ id: cases.id });

        const caseId = result[0]?.id;
        if (!caseId) continue;

        // Insert party if name is provided
        if (d.party_name) {
          await db.insert(parties).values({
            case_id: caseId,
            name: d.party_name,
            litigation_status: d.party_status || "原告",
            phone: d.party_phone || null,
            notes: d.party_notes || null,
          });
        }

        imported++;
      }
    } catch (err) {
      return NextResponse.json({
        success: false,
        error: `导入过程中出错，已成功导入 ${imported} 条`,
        details: { total: rows.length, imported, errors },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        total: rows.length,
        imported,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { success: false, error: "导入失败，请检查文件格式" },
      { status: 500 }
    );
  }
}
