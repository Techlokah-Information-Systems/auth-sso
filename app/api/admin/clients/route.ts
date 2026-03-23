import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import {
  adminSessionCookieName,
  verifyAdminSession,
  verifyAdminPathSecret,
} from "@/lib/adminAuth";

function getAdminFromRequest(req: NextRequest) {
  const token = req.cookies.get(adminSessionCookieName())?.value;
  if (!token) return null;
  return verifyAdminSession(token);
}

function isAdminPathSecretValid(request: NextRequest) {
  const secret = request.headers.get("x-admin-path-secret");
  return verifyAdminPathSecret(secret);
}

export async function GET(request: NextRequest) {
  if (!isAdminPathSecretValid(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminId = getAdminFromRequest(request);
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    orderBy: { created_at: "desc" },
    include: { user: true },
  });
  return NextResponse.json({ clients }, { status: 200 });
}

export async function POST(request: NextRequest) {
  if (!isAdminPathSecretValid(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminId = getAdminFromRequest(request);
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const clientId = body.client_id?.trim();
  const redirectUri = body.redirect_uri?.trim();

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "client_id and redirect_uri required" },
      { status: 400 },
    );
  }

  try {
    const client = await prisma.client.upsert({
      where: { client_id: clientId },
      create: {
        client_id: clientId,
        redirect_uri: redirectUri,
      },
      update: {
        redirect_uri: redirectUri,
      },
    });
    return NextResponse.json({ client }, { status: 200 });
  } catch (error) {
    console.error("Add client error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
