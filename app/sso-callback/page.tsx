"use client";

import {
  AuthenticateWithRedirectCallback,
  useAuth,
  useClerk,
} from "@clerk/nextjs";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { linkUserWithClient } from "@/app/actions/auth";
import { Loader } from "@/app/components/loader";

function SSOCallbackHandler() {
  const searchParams = useSearchParams();
  const { isLoaded, sessionId } = useAuth();
  const clerk = useClerk();
  const [linked, setLinked] = useState(false);

  const isComplete = searchParams.get("complete") === "true";

  useEffect(() => {
    if (isComplete && isLoaded && sessionId && clerk.client?.id && !linked) {
      linkUserWithClient(sessionId, clerk.client.id).then(() => {
        setLinked(true);
        const redir = searchParams.get("redirect") || "/";
        globalThis.location.href = redir; // full redirect to apply cookies appropriately
      });
    } else if (isComplete && isLoaded && !sessionId) {
      // If we are complete but no session is found, probably failed or cancelled
      globalThis.location.href = "/sign-in";
    }
  }, [isComplete, isLoaded, sessionId, clerk.client?.id, linked, searchParams]);

  if (isComplete || (isLoaded && sessionId && !linked)) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#5d5971]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#5d5971]">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}

export default function SSOCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-[#5d5971]">
          <Loader />
        </div>
      }
    >
      <SSOCallbackHandler />
    </Suspense>
  );
}
