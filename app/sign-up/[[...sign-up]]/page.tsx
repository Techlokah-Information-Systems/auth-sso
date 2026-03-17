"use client";

import * as React from "react";
import { useSignUp, useSession } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader } from "@/app/components/loader";
import { Suspense } from "react";

function SignUpForm() {
  const { isLoaded: isSignUpLoaded, signUp, setActive } = useSignUp();
  const { isLoaded: isSessionLoaded, session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientId = searchParams.get("client_id");
  const redirectUrl =
    searchParams.get("redirect_url") || searchParams.get("redirect_uri");

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // Auto-redirect if user already has an active session and a redirect URL
    if (isSessionLoaded && session && redirectUrl) {
      router.push(redirectUrl);
    }
  }, [isSessionLoaded, session, redirectUrl, router]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded) return;
    setError("");
    setLoading(true);

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setError(
        err.errors?.[0]?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded || !signUp) return;
    setError("");
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete" && setActive) {
        await setActive({ session: completeSignUp.createdSessionId });
        if (redirectUrl) {
          router.push(redirectUrl);
        } else {
          router.push("/");
        }
      } else {
        setError("Unable to complete sign up. Please try again.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  if (!isSignUpLoaded || !isSessionLoaded || (session && redirectUrl)) {
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
            Create an account to connect with all your enterprise products.
          </p>
          {clientId && (
            <p className="mt-6 text-sm text-gray-500 bg-gray-200 inline-block px-3 py-1 rounded-full">
              Connecting to: <span className="font-semibold">{clientId}</span>
            </p>
          )}
        </div>

        {/* Right Side: Sign Up Card */}
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)] p-4 pt-6 pb-6">
            
            <div className="text-center mb-5">
              <h2 className="text-[25px] font-bold text-[#1c1e21]">Sign Up</h2>
              <p className="text-[15px] text-[#606770] mt-1">
                {pendingVerification ? "Verify your email" : "It's quick and easy."}
              </p>
            </div>
            
            <div className="mb-5 border-b border-[#dadde1]" />

            {pendingVerification ? (
              <form onSubmit={onPressVerify} className="flex flex-col gap-3">
                {error && (
                  <div className="text-[13px] text-[#f02849] p-2 bg-[#ffebe8] border border-[#dd3c10] text-center mb-1">
                    {error}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full text-center tracking-[0.5em] font-mono text-[17px] p-[14px] border border-[#dddfe2] rounded-md outline-none focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2] transition-colors bg-[#f5f6f7]"
                  disabled={loading}
                />
                
                <button
                  type="submit"
                  className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white text-[18px] font-bold py-[10px] rounded-md mt-2 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify email"}
                </button>
                
                <button
                  type="button"
                  onClick={() => setPendingVerification(false)}
                  className="text-[#1877f2] text-[15px] hover:underline mt-2 font-semibold bg-transparent border-none cursor-pointer"
                >
                  Back
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
                  className="w-full text-[17px] p-[10px] bg-[#f5f6f7] border border-[#ccd0d5] rounded-[5px] outline-none focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2] transition-colors"
                  disabled={loading}
                />
                
                <input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full text-[17px] p-[10px] bg-[#f5f6f7] border border-[#ccd0d5] rounded-[5px] outline-none focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2] transition-colors"
                  disabled={loading}
                />
                
                <p className="text-[11px] text-[#777] leading-[1.3] mt-2 text-left">
                  By clicking Sign Up, you agree to our Terms, Privacy Policy and Cookies Policy.
                </p>

                <div className="flex justify-center mt-3">
                  <button
                    type="submit"
                    className="w-auto bg-[#00a400] hover:bg-[#008d00] text-white text-[18px] font-bold py-[8px] px-14 rounded-md transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Please wait..." : "Sign Up"}
                  </button>
                </div>
              </form>
            )}

            {!pendingVerification && (
              <div className="text-center mt-5 pt-3 border-t border-[#dadde1]">
                <Link
                  href={`/sign-in?${new URLSearchParams(Object.fromEntries(searchParams.entries())).toString()}`}
                  className="text-[#1877f2] text-[15px] font-semibold hover:underline"
                >
                  Already have an account?
                </Link>
              </div>
            )}
          </div>
          
          <div className="text-center mt-7 text-[#1c1e21] text-[14px]">
            <span className="font-bold">Enterprise SSO</span> for seamless product access.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-[#f0f2f5]">
          <Loader />
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
