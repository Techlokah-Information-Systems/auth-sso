"use client";

import { SignUp, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import { Suspense } from "react";
import { Protected } from "@/app/components/protected";
import { Loader } from "@/app/components/loader";

function SignUpContent() {
  return (
    <Protected>
      {({ fallbackUrl, signInRedirectUrl, productId, redirectUrl }) => (
        <SignUp
          unsafeMetadata={{
            productId,
            redirectUrl,
          }}
          signInUrl={signInRedirectUrl}
          fallbackRedirectUrl={fallbackUrl}
        />
      )}
    </Protected>
  );
}

export default function SignUpPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <ClerkLoading>
        <Loader />
      </ClerkLoading>
      <ClerkLoaded>
        <Suspense fallback={<Loader />}>
          <SignUpContent />
        </Suspense>
      </ClerkLoaded>
    </div>
  );
}
