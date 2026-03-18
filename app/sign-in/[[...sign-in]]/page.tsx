"use client";

import * as React from "react";
import { useSignIn, useSession, useClerk } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader } from "@/app/components/loader";
import { Suspense } from "react";

function SignInForm() {
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSessionLoaded, session } = useSession();
  const clerk = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientId = searchParams.get("client_id");
  const redirectUrl =
    searchParams.get("redirect_url") || searchParams.get("redirect_uri");

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [needs2FA, setNeeds2FA] = React.useState(false);
  const [factorMessage, setFactorMessage] = React.useState(
    "Enter your authentication code.",
  );
  const [code, setCode] = React.useState("");

  React.useEffect(() => {
    // If the user is already logged in and we have a redirect URL, send them there immediately
    if (isSessionLoaded && session) {
      if (redirectUrl) {
        globalThis.location.href = clerk.buildUrlWithAuth(redirectUrl);
      } else {
        router.push("/");
      }
    }
  }, [isSessionLoaded, session, redirectUrl, clerk, router]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isSignInLoaded) return;
    setError("");
    setLoading(true);

    try {
      // If session exists but useEffect hasn't redirected yet, force the redirect instead of throwing an error when signing in again.
      if (isSessionLoaded && session) {
        if (redirectUrl) {
          globalThis.location.href = clerk.buildUrlWithAuth(redirectUrl); // Force full redirect to ensure cookies persist cross-domain
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
          globalThis.location.href = clerk.buildUrlWithAuth(redirectUrl); // Force full redirect to break out of next/navigation SPA mode
        } else {
          router.push("/");
        }
      } else if (result.status === "needs_second_factor") {
        const factor = signIn.supportedSecondFactors?.[0];
        if (factor && factor.strategy === "phone_code") {
          await signIn.prepareSecondFactor({
            strategy: "phone_code",
            phoneNumberId: factor.phoneNumberId,
          });
          setFactorMessage(
            "Enter the 6-digit code sent via SMS to your phone.",
          );
        } else if (factor && factor.strategy === "email_code") {
          // This tells Clerk to actually send the email!
          await signIn.prepareSecondFactor({
            strategy: "email_code",
            emailAddressId: factor.emailAddressId,
          });
          setFactorMessage(
            `Enter the 6-digit code sent to ${factor.safeIdentifier}.`,
          );
        } else if (factor && factor.strategy === "totp") {
          setFactorMessage(
            "Enter the 6-digit code from your Authenticator App (e.g., Google Authenticator).",
          );
        } else if (factor && factor.strategy === "backup_code") {
          setFactorMessage("Enter one of your emergency backup codes.");
        }
        setNeeds2FA(true);
      } else {
        console.error("SignIn Result not complete:", result);
        setError(
          `Sign-in incomplete. Status: ${result.status}. Check console logs.`,
        );
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

  const handle2FA = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isSignInLoaded) return;
    setError("");
    setLoading(true);

    try {
      const factor = signIn.supportedSecondFactors?.[0];
      if (!factor) {
        throw new Error("No 2FA methods found.");
      }

      const result = await signIn.attemptSecondFactor({
        strategy: factor.strategy as any,
        code,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        if (redirectUrl) {
          globalThis.location.href = clerk.buildUrlWithAuth(redirectUrl);
        } else {
          router.push("/");
        }
      } else {
        setError(`2FA incomplete. Status: ${result.status}`);
      }
    } catch (err: any) {
      console.error("Clerk 2FA Error:", err);
      setError(
        err.errors?.[0]?.message || "Invalid 2FA code. Please try again.",
      );
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
            {needs2FA ? (
              <form onSubmit={handle2FA} className="flex flex-col gap-3">
                <div className="text-center mb-2">
                  <h2 className="text-[20px] font-bold text-[#1c1e21]">
                    Two-Factor Authentication
                  </h2>
                  <p className="text-[14px] text-[#606770] mt-1">
                    {factorMessage}
                  </p>
                </div>

                {error && (
                  <div className="text-[13px] text-[#f02849] p-2 bg-[#ffebe8] border border-[#dd3c10] text-center mb-1">
                    {error}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full text-center tracking-[0.5em] font-mono text-[17px] p-[14px] border border-[#dddfe2] rounded-md outline-none focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2] transition-colors bg-[#f5f6f7]"
                  disabled={loading}
                />

                <button
                  type="submit"
                  className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white text-[20px] font-bold py-[10px] rounded-md mt-2 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>

                <button
                  type="button"
                  onClick={() => setNeeds2FA(false)}
                  className="text-[#1877f2] text-[14px] hover:underline bg-transparent border-none cursor-pointer mt-2"
                >
                  Cancel
                </button>
              </form>
            ) : (
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
            )}

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
