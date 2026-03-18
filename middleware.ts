import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  // Extract standard incoming request details
  const method = req.method;
  const url = req.url;
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  // Log the request
  console.log(`[Request] ${method} | ${url} | IP: ${ip}`);

  const reqUrl = new URL(req.url);

  // Instant Server-Side Bounce: If the user already has a session and tries to view auth pages, bounce them immediately.
  if (
    reqUrl.pathname.startsWith("/sign-in") ||
    reqUrl.pathname.startsWith("/sign-up")
  ) {
    const { userId } = await auth();
    if (userId) {
      const redirectUrl =
        reqUrl.searchParams.get("redirect_url") ||
        reqUrl.searchParams.get("redirect_uri");
      if (redirectUrl) {
        return NextResponse.redirect(redirectUrl);
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

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
