"use client";

import * as React from "react";
import { useSignUp, useSession, useClerk } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader } from "@/app/components/loader";
import { Suspense } from "react";
import { ArrowRight, Eye, Check } from "lucide-react";

export function SignUpForm() {
  const { isLoaded: isSignUpLoaded, signUp, setActive } = useSignUp();
  const { isLoaded: isSessionLoaded, session } = useSession();
  const clerk = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientId = searchParams.get("client_id");
  const redirectUrl =
    searchParams.get("redirect_url") || searchParams.get("redirect_uri");

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    // Auto-redirect if user already has an active session and a redirect URL
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
    if (!isSignUpLoaded) return;
    setError("");
    setLoading(true);

    try {
      // Short-circuit if session exists
      if (isSessionLoaded && session) {
        if (redirectUrl) {
          globalThis.location.href = clerk.buildUrlWithAuth(redirectUrl);
          return;
        } else {
          router.push("/");
          return;
        }
      }

      await signUp.create({
        firstName,
        lastName,
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
          globalThis.location.href = clerk.buildUrlWithAuth(redirectUrl);
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
               {/* Logo mock AMU */}
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
                <div className="w-12 h-1 bg-white rounded-full cursor-pointer flex-shrink-0 relative overflow-hidden">
                   {/* Animated line indicator */}
                   <div className="absolute top-0 left-0 h-full bg-white animate-[pulse_2s_ease-in-out_infinite] w-full"></div>
                </div>
             </div>
           </div>
        </div>

        {/* Right Side Form */}
        <div className="flex w-full md:w-1/2 flex-col p-8 md:p-14 lg:px-20 justify-center h-full overflow-y-auto">
          
          <h1 className="text-white text-[32px] md:text-[40px] font-medium mb-2 tracking-tight">Create an account</h1>
          <p className="text-[#a39fb5] text-[15px] mb-8">
            Already have an account?{" "}
            <Link 
              href={`/sign-in?${new URLSearchParams(Object.fromEntries(searchParams.entries())).toString()}`}
              className="text-[#8a6df2] hover:underline"
            >
              Log in
            </Link>
          </p>

          {pendingVerification ? (
             <form onSubmit={onPressVerify} className="flex flex-col gap-4">
               {error && (
                <div className="text-[13px] text-[#f02849] p-3 bg-[#ffebe8]/10 border border-[#f02849]/50 rounded-[6px]">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Enter 6-digit code sent to your email"
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
                {loading ? "Verifying..." : "Verify email"}
              </button>
              <button
                type="button"
                onClick={() => setPendingVerification(false)}
                className="text-[#8a6df2] text-[14px] hover:underline mt-4 bg-transparent border-none cursor-pointer text-center w-full"
              >
                Change email
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="text-[13px] text-[#f02849] p-3 bg-[#ffebe8]/10 border border-[#f02849]/50 rounded-[6px]">
                  {error}
                </div>
              )}
              
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-1/2 bg-[#3a3648] border border-transparent text-white px-5 py-4 rounded-[6px] outline-none focus:border-[#8a6df2] focus:ring-1 focus:ring-[#8a6df2] transition-colors placeholder:text-[#837f95]"
                  required
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-1/2 bg-[#3a3648] border border-transparent text-white px-5 py-4 rounded-[6px] outline-none focus:border-[#8a6df2] focus:ring-1 focus:ring-[#8a6df2] transition-colors placeholder:text-[#837f95]"
                  required
                />
              </div>

              <input
                type="email"
                placeholder="Email"
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

              <div className="flex items-center gap-3 mt-2 mb-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 rounded-[4px] border border-[#837f95] bg-[#3a3648] group-has-[:checked]:bg-white group-has-[:checked]:border-white transition-colors">
                     <input type="checkbox" required className="peer opacity-0 absolute select-none w-5 h-5 cursor-pointer z-10" />
                     <Check size={14} className="text-[#3a3648] opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[14px] text-white select-none">
                    I agree to the <Link href="/terms" className="text-[#8a6df2] hover:underline">Terms & Conditions</Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#7a5af8] hover:bg-[#6b4ce6] text-white py-4 rounded-[6px] font-medium transition-colors mt-2 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create account"}
              </button>

              <div className="relative flex items-center justify-center mt-6 mb-2">
                <div className="absolute w-full border-t border-[#4a4658]"></div>
                <span className="bg-[#2a2736] px-4 text-[#837f95] text-[13px] relative z-10">Or register with</span>
              </div>

              <div className="flex gap-4">
                <button type="button" className="flex-1 flex items-center justify-center gap-2 border border-[#4a4658] hover:bg-[#3a3648] text-white py-3 rounded-[6px] transition-colors text-[14px]">
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
                  Google
                </button>
                <button type="button" className="flex-1 flex items-center justify-center gap-2 border border-[#4a4658] hover:bg-[#3a3648] text-white py-3 rounded-[6px] transition-colors text-[14px]">
                  <svg width="18" height="18" viewBox="0 0 384 512" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
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

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center bg-[#4f4a65]"><Loader /></div>}>
      <SignUpForm />
    </Suspense>
  );
}
