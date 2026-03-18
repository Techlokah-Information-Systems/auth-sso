"use server";

import prisma from "@/prisma/prisma";
import { clerkClient } from "@clerk/nextjs/server";

export async function linkUserWithClient(
  sessionId: string,
  clerkClientId: string,
) {
  try {
    const client = await clerkClient();
    const session = await client.sessions.getSession(sessionId);

    if (session?.status !== "active") {
      return { success: false, error: "Invalid or inactive session" };
    }

    const clerkUserId = session.userId;

    const user = await prisma.user.findUnique({
      where: { clerk_id: clerkUserId },
    });

    if (!user) {
      return { success: false, error: "User not found in database" };
    }

    await prisma.client.upsert({
      where: { clerk_client_id: clerkClientId },
      create: {
        clerk_client_id: clerkClientId,
        user_id: user.id,
      },
      update: {
        user_id: user.id, // Update relation if client somehow changed user
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error linking user with client:", error);
    return { success: false, error: "Internal server error" };
  }
}
