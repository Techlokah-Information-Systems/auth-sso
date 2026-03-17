"use client";

import * as React from "react";
import { useSignIn, useSession } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader } from "@/app/components/loader";
import { Suspense } from "react";

function SignInForm() {
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSessionLoaded, session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientId = searchParams.get("client_id");
  const redirectUrl =
    searchParams.get("redirect_url") || searchParams.get("redirect_uri");

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // If the user is already logged in and we have a redirect URL, send them there immediately
    if (isSessionLoaded && session && redirectUrl) {
      router.push(redirectUrl);
    }
  }, [isSessionLoaded, session, redirectUrl, router]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isSignInLoaded) return;
    setError("");
    setLoading(true);

    try {
      // If session exists but useEffect hasn't redirected yet, force the redirect instead of throwing an error when signing in again.
      if (isSessionLoaded && session) {
        if (redirectUrl) {
          globalThis.location.href = redirectUrl; // Force full redirect to ensure cookies persist cross-domain
          return;
        } else {
          router.push("/");
          return;
        }
      }

      const result = await signIn.create({
        identifier: emailAddress,
        password,
      });

      console.log("Clerk SignIn Result:", JSON.stringify(result, null, 2));

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        if (redirectUrl) {
          globalThis.location.href = redirectUrl; // Force full redirect to break out of next/navigation SPA mode
        } else {
          router.push("/");
        }
      } else {
        console.error("SignIn Result not complete:", result);
        setError("Unable to complete sign in. Please try again.");
      }
    } catch (err: any) {
      console.error("Clerk Catch Error:", err);
      // Clerk throws an error if a user tries to sign in while already signed in.
      if (err.errors?.[0]?.code === "form_password_incorrect") {
        setError("Invalid email or password. Please try again.");
      } else if (err.errors?.[0]?.code === "identifier_not_found") {
        setError("We couldn't find an account matching that email.");
      } else {
        setError(
          err.errors?.[0]?.message ||
            "Invalid email or password. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isSignInLoaded || !isSessionLoaded || (session && redirectUrl)) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#f0f2f5]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f0f2f5] px-4 font-sans">
      <div className="flex flex-col lg:flex-row items-center justify-between w-full max-w-[980px] gap-8 lg:gap-16 pb-20">
        {/* Left Side: Branding / Messaging */}
        <div className="flex-1 text-center lg:text-left pt-10 lg:pt-0">
          <h1 className="text-5xl lg:text-[4rem] font-bold text-[#1877f2] tracking-tight mb-4">
            AuthServer
          </h1>
          <p className="text-2xl lg:text-[28px] text-[#1c1e21] leading-tight">
            Connect to all your enterprise products with a single seamless
            sign-in.
          </p>
          {clientId && (
            <p className="mt-6 text-sm text-gray-500 bg-gray-200 inline-block px-3 py-1 rounded-full">
              Connecting to: <span className="font-semibold">{clientId}</span>
            </p>
          )}
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)] p-4 pt-6 pb-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {error && (
                <div className="text-[13px] text-[#f02849] p-2 bg-[#ffebe8] border border-[#dd3c10] text-center mb-1">
                  {error}
                </div>
              )}

              <input
                type="email"
                placeholder="Email address"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                required
                className="w-full text-[17px] p-[14px] border border-[#dddfe2] rounded-md outline-none focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2] transition-colors"
                disabled={loading}
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-[17px] p-[14px] border border-[#dddfe2] rounded-md outline-none focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2] transition-colors"
                disabled={loading}
              />

              <button
                type="submit"
                className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white text-[20px] font-bold py-[10px] rounded-md mt-2 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Log In"}
              </button>
            </form>

            <div className="text-center mt-4">
              <button
                type="button"
                className="text-[#1877f2] text-[14px] hover:underline bg-transparent border-none cursor-pointer p-0 m-0"
              >
                Forgotten password?
              </button>
            </div>

            <div className="my-5 border-b border-[#dadde1]" />

            <div className="flex justify-center">
              <Link
                href={`/sign-up?${new URLSearchParams(Object.fromEntries(searchParams.entries())).toString()}`}
                className="bg-[#42b72a] hover:bg-[#36a420] text-white text-[17px] font-semibold py-[12px] px-4 rounded-md transition-colors inline-block"
              >
                Create new account
              </Link>
            </div>
          </div>

          <div className="text-center mt-7 text-[#1c1e21] text-[14px]">
            <span className="font-bold">Enterprise SSO</span> for seamless
            product access.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-[#f0f2f5]">
          <Loader />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
