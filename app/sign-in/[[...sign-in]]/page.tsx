"use client";

import { SignIn, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import { Loader } from "@/app/components/loader";

export default function Page() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <ClerkLoading>
        <Loader />
      </ClerkLoading>
      <ClerkLoaded>
        <SignIn />
      </ClerkLoaded>
    </div>
  );
}
