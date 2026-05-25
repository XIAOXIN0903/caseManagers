import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { readdir } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const dbUrl =
      process.env.TURSO_DATABASE_URL ||
      process.env.DATABASE_URL ||
      "file:sqlite.db";
    const authToken = process.env.TURSO_AUTH_TOKEN;

    const client = createClient({ url: dbUrl, authToken });
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_drizzle%' ORDER BY name"
    );

    let sqlDump = "-- 案件管理系统 数据库备份\n";
    sqlDump += `-- 时间: ${new Date().toISOString()}\n`;
    sqlDump += "-- 格式: SQL\n\n";

    for (const row of tables.rows) {
      const tableName = row[0] as string;
      const data = await client.execute(`SELECT * FROM [${tableName}]`);
      sqlDump += `\n-- ============================================================\n`;
      sqlDump += `-- 表: ${tableName} (${data.rows.length} 行)\n`;
      sqlDump += `-- ============================================================\n\n`;

      for (const dataRow of data.rows) {
        const columns = Object.keys(dataRow);
        const values = Object.values(dataRow).map((v) => {
          if (v === null) return "NULL";
          if (typeof v === "number") return String(v);
          return `'${String(v).replace(/'/g, "''")}'`;
        });
        sqlDump += `INSERT INTO [${tableName}] (${columns.map((c) => `[${c}]`).join(", ")}) VALUES (${values.join(", ")});\n`;
      }
    }

    // Append file manifest
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    try {
      const files = await readdir(uploadDir);
      if (files.length > 0) {
        sqlDump += `\n-- ============================================================\n`;
        sqlDump += `-- 上传文件清单\n`;
        sqlDump += `-- ============================================================\n`;
        for (const file of files) {
          if (file !== ".gitkeep") {
            sqlDump += `-- /uploads/${file}\n`;
          }
        }
      }
    } catch {
      // no uploads directory
    }

    const fileName = `backup_${new Date().toISOString().split("T")[0]}.sql`;

    return new NextResponse(sqlDump, {
      headers: {
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json(
      { success: false, error: "备份失败，请重试" },
      { status: 500 }
    );
  }
}
