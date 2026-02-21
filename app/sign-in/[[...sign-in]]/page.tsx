"use client";

import { Protected } from "@/app/components/protected";
import { SignIn, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import { Suspense } from "react";
import { Loader } from "@/app/components/loader";

// How I want my URL to look like?
// auth.tlinsy.com/sign-in?redirect_url=http://localhost:3000&product_id=<product_id>

function SignInContent() {
  return (
    <Protected>
      {({ fallbackUrl, signUpRedirect }) => (
        <SignIn signUpUrl={signUpRedirect} fallbackRedirectUrl={fallbackUrl} />
      )}
    </Protected>
  );
}

export default function Page() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <ClerkLoading>
        <Loader />
      </ClerkLoading>
      <ClerkLoaded>
        <Suspense fallback={<Loader />}>
          <SignInContent />
        </Suspense>
      </ClerkLoaded>
    </div>
  );
}
