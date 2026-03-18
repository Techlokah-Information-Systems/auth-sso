"use server";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

let ratelimit: Ratelimit | null = null;

try {
  // Use Upstash Redis from env variables assuming they exist.
  // Will fail gracefully if they are absent.
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "10 s"),
      analytics: true,
      prefix: "@upstash/ratelimit",
    });
  }
} catch (error) {
  console.warn("Failed to initialize Upstash Redis ratelimiter:", error);
}

export async function checkRateLimit(actionName: string) {
  if (!ratelimit) {
    // If not configured, we fail open so the app keeps working,
    // but the user still needs to configure upstash redis for actual protection
    return { success: true };
  }

  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    const key = `${actionName}:${ip}`;

    const { success } = await ratelimit.limit(key);

    if (!success) {
      return {
        success: false,
        error: "Too many requests. Please try again later.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail-open strategy
    return { success: true };
  }
}
