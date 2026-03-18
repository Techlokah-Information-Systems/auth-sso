"use client";

import * as React from "react";
import { useSignIn, useSession, useClerk } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader } from "@/app/components/loader";
import { Suspense } from "react";
import { ArrowRight, Eye } from "lucide-react";
import { checkRateLimit } from "@/app/actions/ratelimit";
import { linkUserWithClient } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Image from "next/image";

export function SignInForm() {
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSessionLoaded, session } = useSession();
  const clerk = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const [showPassword, setShowPassword] = React.useState(false);

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

  const handleSuccessfulSignIn = async (createdSessionId: string | null) => {
    if (!setActive || !createdSessionId) return;

    // Link user and client in database using the Server Action
    if (clerk.client?.id) {
      await linkUserWithClient(createdSessionId, clerk.client.id);
    }

    await setActive({ session: createdSessionId });
    if (redirectUrl) {
      globalThis.location.href = clerk.buildUrlWithAuth(redirectUrl); // Force full redirect to break out of SPA mode
    } else {
      router.push("/");
    }
  };

  const prepareSecondFactor = async (factor: any) => {
    if (!signIn) return;
    switch (factor.strategy) {
      case "phone_code":
        await signIn.prepareSecondFactor({
          strategy: "phone_code",
          phoneNumberId: factor.phoneNumberId,
        });
        setFactorMessage("Enter the 6-digit code sent via SMS to your phone.");
        break;
      case "email_code":
        await signIn.prepareSecondFactor({
          strategy: "email_code",
          emailAddressId: factor.emailAddressId,
        });
        setFactorMessage(
          `Enter the 6-digit code sent to ${factor.safeIdentifier}.`,
        );
        break;
      case "totp":
        setFactorMessage(
          "Enter the 6-digit code from your Authenticator App (e.g., Google Authenticator).",
        );
        break;
      case "backup_code":
        setFactorMessage("Enter one of your emergency backup codes.");
        break;
    }
  };

  const handleSignInError = (err: any) => {
    const errorCode = err.errors?.[0]?.code;
    if (errorCode === "form_password_incorrect") {
      setError("Invalid email or password. Please try again.");
    } else if (errorCode === "identifier_not_found") {
      setError("We couldn't find an account matching that email.");
    } else {
      setError(
        err.errors?.[0]?.message ||
          "Invalid email or password. Please try again.",
      );
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isSignInLoaded) return;
    setError("");
    setLoading(true);

    try {
      const rateLimitResult = await checkRateLimit("sign-in");
      if (!rateLimitResult.success) {
        setError(rateLimitResult.error || "Too many requests.");
        setLoading(false);
        return;
      }

      // If session exists but useEffect hasn't redirected yet, force the redirect instead of throwing an error when signing in again.
      if (isSessionLoaded && session) {
        if (redirectUrl) {
          globalThis.location.href = clerk.buildUrlWithAuth(redirectUrl);
        } else {
          router.push("/");
        }
        return;
      }

      const result = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (result.status === "complete") {
        await handleSuccessfulSignIn(result.createdSessionId);
      } else if (result.status === "needs_second_factor") {
        const factor = signIn.supportedSecondFactors?.[0];
        if (factor) {
          await prepareSecondFactor(factor);
        }
        setCode("");
        setNeeds2FA(true);
      } else {
        setError(
          `Sign-in incomplete. Status: ${result.status}. Check console logs.`,
        );
      }
    } catch (err: any) {
      handleSignInError(err);
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
      const rateLimitResult = await checkRateLimit("sign-in-2fa");
      if (!rateLimitResult.success) {
        setError(rateLimitResult.error || "Too many requests.");
        setLoading(false);
        return;
      }

      const factor = signIn.supportedSecondFactors?.[0];
      if (!factor) {
        throw new Error("No 2FA methods found.");
      }

      const result = await signIn.attemptSecondFactor({
        strategy: factor.strategy as any,
        code,
      });

      if (result.status === "complete") {
        await handleSuccessfulSignIn(result.createdSessionId);
      } else {
        setError(`2FA incomplete. Status: ${result.status}`);
      }
    } catch (err: any) {
      setError(
        err.errors?.[0]?.message || "Invalid 2FA code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isSignInLoaded) return;
    setLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: `/sso-callback?complete=true&redirect=${encodeURIComponent(redirectUrl || "/")}`,
      });
    } catch (err: any) {
      setError(
        err.errors?.[0]?.message || "Failed to authenticate with Google.",
      );
      setLoading(false);
    }
  };

  if (!isSignInLoaded || !isSessionLoaded || (session && redirectUrl)) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#5d5971]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#4f4a65] p-4 md:p-8 font-sans antialiased">
      <div className="flex flex-col md:flex-row w-full max-w-[1100px] h-auto md:h-[700px] bg-[#2a2736] rounded-[24px] overflow-hidden shadow-2xl relative">
        {/* Left Side Branding */}
        <div className="relative hidden md:flex flex-col w-1/2 p-8 text-white overflow-hidden rounded-l-[24px] bg-[#3a3556]">
          {/* Background Image Absolute */}
          <div
            className="absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80")',
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {/* Inner Content */}
          <div className="relative z-10 flex justify-between items-center w-full">
            <div className="font-bold text-2xl tracking-widest flex items-center gap-1">
              <div className="flex items-center gap-2 bg-white/20 px-5 py-1 rounded-full">
                <Image
                  src={"/logo.png"}
                  alt="Tlinsy Logo"
                  width={25}
                  height={25}
                />
                <span className="text-lg font-bold tracking-normal">
                  tlinsy.
                </span>
              </div>
            </div>
            <Link
              href="/"
              className="bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-md text-white text-[13px] px-4 py-2 rounded-full flex items-center gap-2"
            >
              Back to website <ArrowRight size={14} />
            </Link>
          </div>

          <div className="relative z-10 mt-auto pb-4">
            <h2 className="text-[32px] font-medium leading-[1.2] mb-6">
              Capturing Moments,
              <br />
              Creating Memories
            </h2>
            <div className="flex gap-2 items-center">
              <div className="w-8 h-1 bg-white/30 rounded-full cursor-pointer"></div>
              <div className="w-12 h-1 bg-white rounded-full cursor-pointer shrink-0 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-white animate-[pulse_2s_ease-in-out_infinite] w-full"></div>
              </div>
              <div className="w-8 h-1 bg-white/30 rounded-full cursor-pointer"></div>
            </div>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="flex w-full md:w-1/2 flex-col p-8 md:p-14 lg:px-20 justify-center h-full overflow-y-auto">
          <h1 className="text-white text-[32px] md:text-[40px] font-medium mb-2 tracking-tight">
            Welcome back
          </h1>
          <p className="text-[#a39fb5] text-[15px] mb-8">
            Don't have an account?{" "}
            <Link
              href={`/sign-up?${new URLSearchParams(Object.fromEntries(searchParams.entries())).toString()}`}
              className="text-[#8a6df2] hover:underline"
            >
              Sign up
            </Link>
          </p>

          {needs2FA ? (
            <form onSubmit={handle2FA} className="flex flex-col gap-4">
              <Label className="text-[#a39fb5] text-[14px]">
                {factorMessage}
              </Label>
              {error && (
                <div className="text-[13px] text-[#f02849] p-3 bg-[#ffebe8]/10 border border-[#f02849]/50 rounded-[6px]">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2 items-center w-full py-2">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(val) => setCode(val)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot
                      index={0}
                      className="w-12 h-14 md:w-14 items-center justify-center bg-[#3a3648] border-transparent text-white text-xl rounded-l-[6px] focus-visible:ring-1 focus-visible:ring-[#8a6df2]"
                    />
                    <InputOTPSlot
                      index={1}
                      className="w-12 h-14 md:w-14 items-center justify-center bg-[#3a3648] border-transparent border-l-[#4a4658]/50 text-white text-xl focus-visible:ring-1 focus-visible:ring-[#8a6df2]"
                    />
                    <InputOTPSlot
                      index={2}
                      className="w-12 h-14 md:w-14 items-center justify-center bg-[#3a3648] border-transparent border-l-[#4a4658]/50 text-white text-xl rounded-r-[6px] focus-visible:ring-1 focus-visible:ring-[#8a6df2]"
                    />
                  </InputOTPGroup>
                  <InputOTPSeparator className="text-[#837f95]" />
                  <InputOTPGroup>
                    <InputOTPSlot
                      index={3}
                      className="w-12 h-14 md:w-14 items-center justify-center bg-[#3a3648] border-transparent text-white text-xl rounded-l-[6px] focus-visible:ring-1 focus-visible:ring-[#8a6df2]"
                    />
                    <InputOTPSlot
                      index={4}
                      className="w-12 h-14 md:w-14 items-center justify-center bg-[#3a3648] border-transparent border-l-[#4a4658]/50 text-white text-xl focus-visible:ring-1 focus-visible:ring-[#8a6df2]"
                    />
                    <InputOTPSlot
                      index={5}
                      className="w-12 h-14 md:w-14 items-center justify-center bg-[#3a3648] border-transparent border-l-[#4a4658]/50 text-white text-xl rounded-r-[6px] focus-visible:ring-1 focus-visible:ring-[#8a6df2]"
                    />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#7a5af8] hover:bg-[#6b4ce6] text-white h-14 rounded-[6px] text-base font-medium transition-colors mt-2"
                disabled={loading || code.length < 6}
              >
                {loading ? "Verifying..." : "Verify code"}
              </Button>
              <button
                type="button"
                onClick={() => setNeeds2FA(false)}
                className="text-[#8a6df2] text-[14px] hover:underline mt-4 bg-transparent border-none cursor-pointer text-center w-full"
              >
                Cancel
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="text-[13px] text-[#f02849] p-3 bg-[#ffebe8]/10 border border-[#f02849]/50 rounded-[6px]">
                  {error}
                </div>
              )}

              <Input
                type="email"
                placeholder="Email address"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full bg-[#3a3648] border-transparent text-white px-5 h-14 rounded-[6px] outline-none focus-visible:ring-1 focus-visible:ring-[#8a6df2] transition-colors placeholder:text-[#837f95]"
                required
              />

              <div className="relative flex items-center">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#3a3648] border-transparent text-white pl-5 pr-14 h-14 rounded-[6px] outline-none focus-visible:ring-1 focus-visible:ring-[#8a6df2] transition-colors placeholder:text-[#837f95]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-[#837f95] hover:text-white transition-colors"
                >
                  <Eye size={20} />
                </button>
              </div>

              <div className="flex justify-between items-center mt-2 mb-2">
                <div></div>
                <Link
                  href={`/forgot-password?${new URLSearchParams(Object.fromEntries(searchParams.entries())).toString()}`}
                  className="text-[#8a6df2] text-[14px] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#7a5af8] hover:bg-[#6b4ce6] text-white h-14 rounded-[6px] text-base font-medium transition-colors mt-2"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Log in"}
              </Button>

              <div className="flex gap-4 items-center w-full my-4">
                <div className="h-px w-full bg-[#4a4658]"></div>
                <span className="text-[#837f95] text-[13px] uppercase tracking-wider font-semibold">
                  Or
                </span>
                <div className="h-px w-full bg-[#4a4658]"></div>
              </div>

              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-[#3a3648] hover:bg-[#4a4658] border-transparent text-white h-14 rounded-[6px] outline-none transition-colors flex items-center justify-center gap-3 text-base font-medium"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-[#4f4a65]">
          <Loader />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
