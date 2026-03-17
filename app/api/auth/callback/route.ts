import prisma from "@/prisma/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { client_id, clerk_id } = await request.json();

    if (!client_id || !clerk_id) {
      return NextResponse.json(
        { error: "Missing client_id or clerk_id" },
        { status: 400 },
      );
    }

    // Security: Ensure the user is authenticated and matches the clerk_id being updated
    const { userId } = await auth();
    if (!userId || userId !== clerk_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: {
        clerk_id,
      },
      data: {
        clients: {
          upsert: {
            where: {
              clerk_client_id: client_id,
            },
            create: {
              clerk_client_id: client_id,
            },
            update: {},
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Client linked successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Link Client Error:", error);

    // Handle Prisma "Record not found" error (e.g., if user doesn't exist yet)
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "User not found. Syncing may still be in progress." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
