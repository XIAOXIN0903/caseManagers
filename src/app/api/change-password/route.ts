import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  const payload = await verifyToken();
  if (!payload) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "请输入当前密码和新密码" },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { success: false, error: "新密码至少需要4位" },
        { status: 400 }
      );
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (currentPassword !== adminPassword) {
      return NextResponse.json(
        { success: false, error: "当前密码错误" },
        { status: 400 }
      );
    }

    // Update .env.local
    const envPath = path.join(process.cwd(), ".env.local");
    const envContent = await readFile(envPath, "utf-8");
    const updated = envContent.replace(
      /^ADMIN_PASSWORD=.*$/m,
      `ADMIN_PASSWORD=${newPassword}`
    );

    if (!envContent.includes("ADMIN_PASSWORD=")) {
      return NextResponse.json(
        { success: false, error: "配置文件异常，无法修改" },
        { status: 500 }
      );
    }

    await writeFile(envPath, updated, "utf-8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, error: "修改密码失败，请重试" },
      { status: 500 }
    );
  }
}
