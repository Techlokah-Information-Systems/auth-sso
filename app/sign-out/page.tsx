"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader } from "@/app/components/loader";

function SignOutAction() {
  const { signOut } = useClerk();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/";

  useEffect(() => {
    signOut({ redirectUrl });
  }, [signOut, redirectUrl]);

  return <Loader />;
}

export default function SignOutPage() {
  return (
    <div className="flex h-screen w-screen justify-center items-center">
      <Suspense fallback={<Loader />}>
        <SignOutAction />
      </Suspense>
    </div>
  );
}
