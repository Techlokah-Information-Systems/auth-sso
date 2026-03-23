import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  hashPassword,
  verifyPassword,
  signAdminSession,
  adminSessionCookieName,
  verifyAdminPathSecret,
} from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-admin-path-secret");
    if (!verifyAdminPathSecret(secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json(
        { error: "username and password required" },
        { status: 400 },
      );
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: { username },
    });
    if (!existingAdmin) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    if (!verifyPassword(password, existingAdmin.password_hash)) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    const session = signAdminSession(existingAdmin.id);
    const res = NextResponse.json(
      { message: "Login successful" },
      { status: 200 },
    );
    res.cookies.set({
      name: adminSessionCookieName(),
      value: session,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return res;
  } catch (error) {
    console.error("admin login error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
