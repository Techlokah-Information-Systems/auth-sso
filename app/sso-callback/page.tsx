"use client";

import { useEffect, Suspense } from "react";
import { Protected } from "@/app/components/protected";
import { Loader } from "@/app/components/loader";

function SSOCallbackAction({
  redirectUrl,
}: Readonly<{ redirectUrl: string | null }>) {
  useEffect(() => {
    if (redirectUrl) {
      globalThis.location.href = redirectUrl;
    }
  }, [redirectUrl]);

  return <Loader />;
}

function SSOCallbackContent() {
  return (
    <Protected>
      {({ redirectUrl }) => <SSOCallbackAction redirectUrl={redirectUrl} />}
    </Protected>
  );
}

export default function SSOCallbackPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Suspense fallback={<Loader />}>
        <SSOCallbackContent />
      </Suspense>
    </div>
  );
}
