"use server";

import prisma from "@/prisma/prisma";

export async function checkDomain(domain: string) {
  try {
    const origin = new URL(domain).origin;
    const product = await prisma.product.findUnique({
      where: {
        domain: origin,
      },
    });
    return product?.domain === origin;
  } catch (error) {
    console.error("Error checking domain:", error);
    return false;
  }
}
