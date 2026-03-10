"use client";

import { SignUp, ClerkLoading, ClerkLoaded, useSignUp } from "@clerk/nextjs";
import { Loader } from "@/app/components/loader";

export default function SignUpPage() {
  const { signUp } = useSignUp();

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <ClerkLoading>
        <Loader />
      </ClerkLoading>
      <ClerkLoaded>
        <SignUp />
      </ClerkLoaded>
    </div>
  );
}
