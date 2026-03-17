"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader } from "@/app/components/loader";

function SignOutAction() {
  const { signOut } = useClerk();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/";
  const clientId = searchParams.get("client_id");

  useEffect(() => {
    // Attempt sign out when component mounts
    signOut({ redirectUrl });
  }, [signOut, redirectUrl]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <Loader />
      <h2 className="text-[20px] font-semibold text-[#1c1e21]">Signing out...</h2>
      {clientId && (
        <p className="text-[14px] text-[#606770]">
          Disconnecting from <span className="font-semibold">{clientId}</span>
        </p>
      )}
    </div>
  );
}

export default function SignOutPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f0f2f5] font-sans">
      <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)] p-8 w-full max-w-[400px]">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <Loader />
              <h2 className="text-[20px] font-semibold text-[#1c1e21]">Signing out...</h2>
            </div>
          }
        >
          <SignOutAction />
        </Suspense>
      </div>
    </div>
  );
}
