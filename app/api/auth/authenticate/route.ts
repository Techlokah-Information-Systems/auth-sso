import prisma from "@/prisma/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { client_id, redirect_uri } = await request.json();
    if (!client_id || !redirect_uri) {
      return NextResponse.json(
        { error: "client_id and redirect_uri required" },
        { status: 400 },
      );
    }

    const { userId, isAuthenticated } = await auth();
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerk_id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const client = await prisma.client.findFirst({
      where: {
        client_id,
        redirect_uri,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not registered or redirect URI mismatch" },
        { status: 403 },
      );
    }

    await prisma.client.update({
      where: { id: client.id },
      data: { user_id: user.id },
    });

    return NextResponse.json(
      { message: "Linked successfully", redirect_uri },
      { status: 200 },
    );
  } catch (error) {
    console.error("Authenticate link error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
