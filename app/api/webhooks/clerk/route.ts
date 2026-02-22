import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ratelimit } from "@/app/utils/ratelimit";

async function handleUserCreated(eventData: Record<string, any>) {
  const { id, first_name, last_name, email_addresses } = eventData;
  const email = email_addresses[0].email_address;

  try {
    const user = await prisma.user.create({
      data: {
        first_name,
        last_name,
        email,
        clerk_id: id,
      },
    });

    return user;
  } catch (error) {
    console.error("Error creating user: ", error);
  }
}

async function handleUserUpdated(eventData: Record<string, any>) {
  const { id } = eventData;
  try {
    const user = await prisma.user.update({
      where: {
        clerk_id: id,
      },
      data: {
        first_name: eventData.first_name,
        last_name: eventData.last_name,
        email: eventData.email_addresses[0].email_address,
      },
    });
    return user;
  } catch (error) {
    console.error("Error updating user: ", error);
  }
}

async function handleUserDeleted(eventData: Record<string, any>) {
  const { id } = eventData;
  try {
    const user = await prisma.user.delete({
      where: {
        clerk_id: id,
      },
    });
    return user;
  } catch (error) {
    console.error("Error deleting user: ", error);
  }
}

export async function POST(request: NextRequest) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
  const ip = request.headers.get("x-forwarded-for") || "[IP_ADDRESS]";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      {
        message: "Too many requests",
      },
      { status: 429 },
    );
  }
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      {
        message: "Webhook Secret not found",
      },
      { status: 500 },
    );
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      {
        message: "Invalid webhook headers",
      },
      { status: 400 },
    );
  }

  const payload = await request.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    console.error("Error Verifying Webhook: ", error);
    return NextResponse.json(
      {
        message: "Invalid webhook headers",
      },
      { status: 400 },
    );
  }

  const { id } = evt.data;
  const eventType = evt.type;

  switch (eventType) {
    case "user.created":
      await handleUserCreated(evt.data);
      break;
    case "user.updated":
      await handleUserUpdated(evt.data);
      break;
    case "user.deleted":
      await handleUserDeleted(evt.data);
      break;
  }

  console.log("Webhook received successfully");
  console.log("Event Type: ", evt.data);
  console.log("Event ID: ", id);

  return NextResponse.json(
    {
      message: "Webhook received successfully",
    },
    { status: 200 },
  );
}
