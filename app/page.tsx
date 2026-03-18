"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader } from "@/app/components/loader";
import { ArrowRight, LogOut, ShieldCheck, Mail, Clock } from "lucide-react";
import React from "react";

export default function HomePage() {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#4f4a65]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#4f4a65] p-4 md:p-8 font-sans antialiased">
      <div className="w-full max-w-[500px] bg-[#2a2736] rounded-[24px] overflow-hidden shadow-2xl relative">
        
        {/* Header Cover Banner */}
        <div 
          className="w-full h-32 relative flex items-center justify-end p-6"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[#2a2736]/40 backdrop-blur-sm"></div>
          
          {/* Mock Logo */}
          <div className="relative z-10 flex items-center justify-end w-full">
            <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
              <path d="M4.5 18L10 4L15.5 18M10 4H30M25 18L30 4L35 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center px-8 pb-10">
          <div className="w-24 h-24 rounded-full border-4 border-[#2a2736] overflow-hidden -mt-12 relative z-10 bg-[#3a3648] shadow-lg mb-4">
            <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-[#a39fb5] text-[15px] mb-8 flex items-center gap-2">
             {user.primaryEmailAddress?.emailAddress}
          </p>

          {/* User Details Box */}
          <div className="w-full bg-[#3a3648] rounded-[16px] p-5 mb-8 flex flex-col gap-5 border border-[#4a4658]">
            <div className="flex justify-between items-center border-b border-[#4a4658] pb-4">
              <span className="text-[#837f95] flex items-center gap-2 text-[14px]">
                <ShieldCheck size={16} className="text-[#8a6df2]" /> Auth Status
              </span>
              <span className="text-[#10b981] flex items-center gap-2 text-[14px] font-medium bg-[#10b981]/10 px-3 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div> Active Session
              </span>
            </div>
            
            <div className="flex justify-between items-center border-b border-[#4a4658] pb-4">
               <span className="text-[#837f95] flex items-center gap-2 text-[14px]">
                 <Mail size={16} className="text-[#8a6df2]" /> Email Verified
               </span>
               <span className="text-white text-[14px] font-medium">
                 {user.primaryEmailAddress?.verification.status === "verified" ? "Yes" : "No"}
               </span>
            </div>

            <div className="flex justify-between items-center">
               <span className="text-[#837f95] flex items-center gap-2 text-[14px]">
                 <Clock size={16} className="text-[#8a6df2]" /> Last Login
               </span>
               <span className="text-white text-[14px] font-medium">
                 {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Just now"}
               </span>
            </div>
          </div>

          <button
            onClick={() => signOut(() => router.push("/sign-in"))}
            className="w-full flex justify-center items-center gap-2 bg-[#7a5af8] hover:bg-[#6b4ce6] text-white py-[14px] rounded-[6px] font-bold transition-all shadow-[0_4px_14px_0_rgba(122,90,248,0.39)] hover:shadow-[0_6px_20px_rgba(122,90,248,0.23)]"
          >
            <LogOut size={18} />
            Sign Out Securely
          </button>
        </div>

      </div>
    </div>
  );
}
