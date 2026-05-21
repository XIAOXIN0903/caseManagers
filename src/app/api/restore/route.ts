import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { createClient } from "@libsql/client";

export async function POST(request: Request) {
  const payload = await verifyToken();
  if (!payload) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }

  try {
    const { sql } = await request.json();

    if (!sql || typeof sql !== "string") {
      return NextResponse.json(
        { success: false, error: "无效的备份文件" },
        { status: 400 }
      );
    }

    const dbUrl =
      process.env.TURSO_DATABASE_URL ||
      process.env.DATABASE_URL ||
      "file:sqlite.db";
    const authToken = process.env.TURSO_AUTH_TOKEN;

    const client = createClient({ url: dbUrl, authToken });

    // Parse SQL statements and execute them
    const statements = sql
      .split(";\n")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        await client.execute(stmt);
      } catch {
        // Skip errors for individual statements (e.g., duplicate inserts)
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json(
      { success: false, error: "恢复失败，请重试" },
      { status: 500 }
    );
  }
}
