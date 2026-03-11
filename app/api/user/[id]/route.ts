import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id;

  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: {
      clerk_id: id,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User Not Found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      user,
    },
    { status: 200 },
  );
}
