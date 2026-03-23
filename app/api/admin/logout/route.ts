import { NextRequest, NextResponse } from "next/server";
import { adminSessionCookieName } from "@/lib/adminAuth";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out" }, { status: 200 });
  res.cookies.set({
    name: adminSessionCookieName(),
    value: "",
    maxAge: 0,
    path: "/",
  });
  return res;
}
