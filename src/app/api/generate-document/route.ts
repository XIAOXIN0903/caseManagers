import { NextRequest, NextResponse } from "next/server";
import { getCaseDataForTemplate, generateDocxFile } from "@/lib/document-generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, templateId, customFields } = body as {
      caseId: number;
      templateId: number;
      customFields?: Record<string, string>;
    };

    if (!caseId || !templateId) {
      return NextResponse.json(
        { success: false, error: "缺少参数" },
        { status: 400 }
      );
    }

    const caseDataResult = await getCaseDataForTemplate(caseId);
    if (caseDataResult.error || !caseDataResult.data) {
      return NextResponse.json(
        { success: false, error: caseDataResult.error || "案件不存在" },
        { status: 404 }
      );
    }

    const result = generateDocxFile(
      templateId,
      caseDataResult.data,
      customFields || {}
    );

    if ("error" in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "生成失败，请重试" },
      { status: 500 }
    );
  }
}
