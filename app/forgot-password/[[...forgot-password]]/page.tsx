"use client";

import * as React from "react";
import { useSignIn, useSession, useClerk } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader } from "@/app/components/loader";
import { Suspense } from "react";
import { ArrowRight, Eye } from "lucide-react";

export function ForgotPasswordForm() {
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
  const [code, setCode] = React.useState("");
  const [codeSent, setCodeSent] = React.useState(false);
  
  const [needs2FA, setNeeds2FA] = React.useState(false);
  const [factorMessage, setFactorMessage] = React.useState("Enter your authentication code.");
  const [mfaCode, setMfaCode] = React.useState("");

  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    if (isSessionLoaded && session) {
      if (redirectUrl) {
        globalThis.location.href = clerk.buildUrlWithAuth(redirectUrl);
      } else {
        router.push("/");
      }
    }
  }, [isSessionLoaded, session, redirectUrl, clerk, router]);

  const handleSendCode = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isSignInLoaded) return;
    setError("");
    setLoading(true);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: emailAddress,
      });
      setCodeSent(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isSignInLoaded) return;
    setError("");
    setLoading(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        if (redirectUrl) {
          globalThis.location.href = clerk.buildUrlWithAuth(redirectUrl);
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
          setFactorMessage("Enter the 6-digit code sent via SMS to your phone.");
        } else if (factor && factor.strategy === "email_code") {
          await signIn.prepareSecondFactor({
            strategy: "email_code",
            emailAddressId: factor.emailAddressId,
          });
          setFactorMessage(`Enter the 6-digit code sent to ${factor.safeIdentifier}.`);
        } else if (factor && factor.strategy === "totp") {
          setFactorMessage("Enter the 6-digit code from your Authenticator App.");
        } else if (factor && factor.strategy === "backup_code") {
          setFactorMessage("Enter one of your emergency backup codes.");
        }
        setNeeds2FA(true);
      } else {
        setError(`Password reset incomplete. Status: ${result.status}. Check console logs.`);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid code or password format.");
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
        code: mfaCode,
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
      setError(err.errors?.[0]?.message || "Invalid 2FA code. Please try again.");
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
               backgroundImage: 'url("https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80")',
               backgroundSize: 'cover',
               backgroundPosition: 'center',
             }}
           />
           {/* Inner Content */}
           <div className="relative z-10 flex justify-between items-center w-full">
             <div className="font-bold text-2xl tracking-widest flex items-center gap-1">
               <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M4.5 18L10 4L15.5 18M10 4H30M25 18L30 4L35 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
             </div>
             <a href="/" className="bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-md text-white text-[13px] px-4 py-2 rounded-full flex items-center gap-2">
               Back to website <ArrowRight size={14} />
             </a>
           </div>

           <div className="relative z-10 mt-auto pb-4">
             <h2 className="text-[32px] font-medium leading-[1.2] mb-6">
               Capturing Moments,<br/>Creating Memories
             </h2>
             <div className="flex gap-2 items-center">
                <div className="w-8 h-1 bg-white/30 rounded-full cursor-pointer"></div>
                <div className="w-8 h-1 bg-white/30 rounded-full cursor-pointer"></div>
                <div className="w-8 h-1 bg-white/30 rounded-full cursor-pointer"></div>
                <div className="w-12 h-1 bg-white rounded-full cursor-pointer flex-shrink-0 relative overflow-hidden">
                   <div className="absolute top-0 left-0 h-full bg-white animate-[pulse_2s_ease-in-out_infinite] w-full"></div>
                </div>
             </div>
           </div>
        </div>

        {/* Right Side Form */}
        <div className="flex w-full md:w-1/2 flex-col p-8 md:p-14 lg:px-20 justify-center h-full overflow-y-auto">
          
          <div className="text-left mb-8">
            <h1 className="text-white text-[32px] md:text-[40px] font-medium mb-2 tracking-tight">Recovery</h1>
            <p className="text-[#a39fb5] text-[15px]">
              Remembered your password?{" "}
              <Link 
                href={`/sign-in?${new URLSearchParams(Object.fromEntries(searchParams.entries())).toString()}`}
                className="text-[#8a6df2] hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>

          {needs2FA ? (
            <form onSubmit={handle2FA} className="flex flex-col gap-4">
              <p className="text-[#a39fb5] text-[14px]">
                {factorMessage}
              </p>
              {error && (
                <div className="text-[13px] text-[#f02849] p-3 bg-[#ffebe8]/10 border border-[#f02849]/50 rounded-[6px]">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
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
            </form>
          ) : codeSent ? (
             <form onSubmit={handleReset} className="flex flex-col gap-4">
               {error && (
                <div className="text-[13px] text-[#f02849] p-3 bg-[#ffebe8]/10 border border-[#f02849]/50 rounded-[6px]">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Enter 6-digit reset code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-[#3a3648] border border-transparent text-white px-5 py-4 rounded-[6px] outline-none focus:border-[#8a6df2] focus:ring-1 focus:ring-[#8a6df2] transition-colors placeholder:text-[#837f95]"
                  required
                />
                
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
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
              </div>
              <button
                type="submit"
                className="w-full bg-[#7a5af8] hover:bg-[#6b4ce6] text-white py-4 rounded-[6px] font-medium transition-colors mt-2 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset password"}
              </button>
              <button
                type="button"
                onClick={() => setCodeSent(false)}
                className="text-[#8a6df2] text-[14px] hover:underline mt-4 bg-transparent border-none cursor-pointer text-center w-full"
              >
                Go back
              </button>
            </form>
          ) : (
            <form onSubmit={handleSendCode} className="flex flex-col gap-4">
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

              <button
                type="submit"
                className="w-full bg-[#7a5af8] hover:bg-[#6b4ce6] text-white py-4 rounded-[6px] font-medium transition-colors mt-2 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Searching..." : "Send reset code"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center bg-[#4f4a65]"><Loader /></div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
