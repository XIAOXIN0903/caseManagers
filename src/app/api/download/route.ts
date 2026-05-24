import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get("file");
  const name = request.nextUrl.searchParams.get("name");

  if (!file) {
    return NextResponse.json({ error: "缺少文件参数" }, { status: 400 });
  }

  const safePath = path.normalize(file).replace(/^\.\.?[\\/]/, "");
  const filePath = path.join(process.cwd(), "public", safePath);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  const buffer = await readFile(filePath);
  const downloadName = name || path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  // encode filename for Content-Disposition (RFC 5987)
  const encodedName = encodeURIComponent(downloadName);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
      "Content-Length": String(buffer.length),
    },
  });
}
