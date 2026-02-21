"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect, Suspense } from "react";
import { Protected } from "@/app/components/protected";

function SignOutAction({
  redirectUrl,
}: Readonly<{ redirectUrl: string | null }>) {
  const { signOut } = useClerk();

  useEffect(() => {
    if (redirectUrl) {
      // Utilize Clerk's built-in options for signout routing
      signOut({ redirectUrl });
    }
  }, [signOut, redirectUrl]);

  return (
    <div className="flex h-screen w-screen justify-center items-center">
      Signing out...
    </div>
  );
}

function SignOutContent() {
  return (
    <Protected>
      {({ redirectUrl }) => <SignOutAction redirectUrl={redirectUrl} />}
    </Protected>
  );
}

export default function SignOutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen justify-center items-center">
          Loading...
        </div>
      }
    >
      <SignOutContent />
    </Suspense>
  );
}
