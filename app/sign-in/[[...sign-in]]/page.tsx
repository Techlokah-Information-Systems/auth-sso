"use client";

import * as React from "react";
import { useSignIn, useSession, useClerk } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader } from "@/app/components/loader";
import { Suspense } from "react";
import { ArrowRight, Eye } from "lucide-react";

export function SignInForm() {
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
        setError(
          `Sign-in incomplete. Status: ${result.status}. Check console logs.`,
        );
      }
    } catch (err: any) {
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
      setError(
        err.errors?.[0]?.message || "Invalid 2FA code. Please try again.",
      );
    } finally {
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
              <svg
                width="40"
                height="20"
                viewBox="0 0 40 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.5 18L10 4L15.5 18M10 4H30M25 18L30 4L35 18"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <a
              href="/"
              className="bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-md text-white text-[13px] px-4 py-2 rounded-full flex items-center gap-2"
            >
              Back to website <ArrowRight size={14} />
            </a>
          </div>

          <div className="relative z-10 mt-auto pb-4">
            <h2 className="text-[32px] font-medium leading-[1.2] mb-6">
              Capturing Moments,
              <br />
              Creating Memories
            </h2>
            <div className="flex gap-2 items-center">
              <div className="w-8 h-1 bg-white/30 rounded-full cursor-pointer"></div>
              <div className="w-12 h-1 bg-white rounded-full cursor-pointer flex-shrink-0 relative overflow-hidden">
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
              <p className="text-[#a39fb5] text-[14px]">{factorMessage}</p>
              {error && (
                <div className="text-[13px] text-[#f02849] p-3 bg-[#ffebe8]/10 border border-[#f02849]/50 rounded-[6px]">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-[#3a3648] border border-transparent text-white px-5 py-4 rounded-[6px] outline-none focus:border-[#8a6df2] focus:ring-1 focus:ring-[#8a6df2] transition-colors placeholder:text-[#837f95]"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#7a5af8] hover:bg-[#6b4ce6] text-white py-4 rounded-[6px] font-medium transition-colors mt-2 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify code"}
              </button>
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

              <input
                type="email"
                placeholder="Email address"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full bg-[#3a3648] border border-transparent text-white px-5 py-4 rounded-[6px] outline-none focus:border-[#8a6df2] focus:ring-1 focus:ring-[#8a6df2] transition-colors placeholder:text-[#837f95]"
                required
              />

              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#3a3648] border border-transparent text-white pl-5 pr-14 py-4 rounded-[6px] outline-none focus:border-[#8a6df2] focus:ring-1 focus:ring-[#8a6df2] transition-colors placeholder:text-[#837f95]"
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

              <button
                type="submit"
                className="w-full bg-[#7a5af8] hover:bg-[#6b4ce6] text-white py-4 rounded-[6px] font-medium transition-colors mt-2 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Log in"}
              </button>

              <div className="relative flex items-center justify-center mt-6 mb-2">
                <div className="absolute w-full border-t border-[#4a4658]"></div>
                <span className="bg-[#2a2736] px-4 text-[#837f95] text-[13px] relative z-10">
                  Or log in with
                </span>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 border border-[#4a4658] hover:bg-[#3a3648] text-white py-3 rounded-[6px] transition-colors text-[14px]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path
                        fill="#4285F4"
                        d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                      />
                      <path
                        fill="#34A853"
                        d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                      />
                    </g>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 border border-[#4a4658] hover:bg-[#3a3648] text-white py-3 rounded-[6px] transition-colors text-[14px]"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 384 512"
                    fill="white"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                  Apple
                </button>
              </div>
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
