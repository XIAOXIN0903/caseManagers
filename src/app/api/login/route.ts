import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "请输入密码" },
        { status: 400 }
      );
    }

    const token = await createToken(password);

    const response = NextResponse.json({ success: true });
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "操作失败，请重试";
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }
}
