import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const headers = [
    "法院案号",
    "律所管理号",
    "案由",
    "受理法院",
    "主审法官",
    "法官电话",
    "法官助理",
    "助理电话",
    "立案日期",
    "案件状态",
    "标的额",
    "对方律师",
    "对方律所",
    "对方电话",
    "案件描述",
    "当事人姓名",
    "诉讼地位",
    "当事人电话",
    "当事人备注",
  ];

  const exampleRow = [
    "(2024)京0105民初12345号",
    "JD-2024-001",
    "买卖合同纠纷",
    "北京市朝阳区人民法院",
    "张三",
    "010-88888888",
    "李四",
    "010-66666666",
    "2024-03-15",
    "立案",
    500000,
    "王五",
    "某某律师事务所",
    "13800000000",
    "案件简要描述，可选填",
    "赵六",
    "原告",
    "13900000000",
    "当事人备注，可选填",
  ];

  // Create a sheet with headers as first row
  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);

  // Set column widths
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length * 2, 15) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "案件导入模板");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="案件导入模板.xlsx"`,
    },
  });
}
