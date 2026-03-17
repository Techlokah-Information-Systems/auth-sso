import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  // Extract standard incoming request details
  const method = req.method;
  const url = req.url;
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  
  // Log the request
  console.log(`[Request] ${method} | ${url} | IP: ${ip}`);

  // Continue to the requested route
  return NextResponse.next();
});

export const config = {
  // The matcher dictates which routes this middleware runs on.
  // This matches all routes EXCEPT static files (like .css, .png) and next internal routes (_next).
  // It ensures your API routes and pages get correctly logged and protected.
  matcher: [
    String.raw`/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)`,
    String.raw`/(api|trpc)(.*)`,
  ],
};
