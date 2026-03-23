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

    const existingClient = await prisma.client.findUnique({
      where: { client_id: clerkClientId },
    });

    if (!existingClient) {
      return { success: false, error: "Client not registered" };
    }

    await prisma.client.update({
      where: { id: existingClient.id },
      data: { user_id: user.id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error linking user with client:", error);
    return { success: false, error: "Internal server error" };
  }
}
