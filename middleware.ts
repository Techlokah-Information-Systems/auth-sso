import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  // Extract standard incoming request details
  const method = req.method;
  const url = req.url;
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  // Log the request
  console.log(`[Request] ${method} | ${url} | IP: ${ip}`);

  // Because multi-domain single sign-on requires Clerk's frontend JS SDK to generate a ticket (clerk.buildUrlWithAuth),
  // we must NOT intercept the session here in middleware. We let the client component handle the redirect so the target domain gets the session URL params.

  // Continue to the requested route
  return NextResponse.next();
});

export const config = {
  // The matcher dictates which routes this middleware runs on.
  // This matches all routes EXCEPT static files (like .css, .png) and next internal routes (_next).
  // It ensures your API routes and pages get correctly logged and protected.
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
