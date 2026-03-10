"use client";

import * as React from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Loader } from "@/app/components/loader";
import { Suspense } from "react";

function SignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Getting the client_id if passed in the URL, as requested for the OAuth application feature
  const clientId = searchParams.get("client_id");

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
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
      console.error(JSON.stringify(err, null, 2));
      setError(
        err.errors?.[0]?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        // Optional: If you need to redirect back to your client app in the OAuth flow,
        // you might handle that here or use Clerk's default redirect behavior.
        router.push("/");
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
        setError("Unable to complete sign up. Please try again.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center p-4 overflow-hidden bg-linear-to-br from-indigo-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
        <Loader />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-linear-to-br from-indigo-50 via-white to-cyan-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-black" />
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-160 h-160 rounded-full bg-blue-300/30 dark:bg-indigo-600/20 blur-[130px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-1000" />
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-140 h-140 rounded-full bg-purple-300/30 dark:bg-purple-900/30 blur-[130px] mix-blend-multiply dark:mix-blend-screen" />

      <Card className="relative z-10 w-full max-w-[420px] shadow-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-zinc-950/60 backdrop-blur-2xl rounded-3xl overflow-hidden">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Create an account
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {pendingVerification
              ? "We've sent a verification code to your email."
              : "Enter your email and password to sign up"}
            {clientId && (
              <span className="block mt-1 text-xs opacity-50">
                Connecting to app: {clientId}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingVerification ? (
            <form onSubmit={onPressVerify} className="space-y-4">
              {error && (
                <div className="text-sm font-medium text-destructive text-center p-2 bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  className="h-11 text-center text-lg tracking-widest font-mono"
                  maxLength={6}
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-base font-medium"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify email"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setPendingVerification(false)}
              >
                Back to sign up
              </Button>
            </form>
          ) : (
            <div className="space-y-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="text-sm font-medium text-destructive text-center p-2 bg-destructive/10 rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    required
                    className="h-11"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                    disabled={loading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium"
                  disabled={loading}
                >
                  {loading ? "Please wait..." : "Sign up"}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center text-sm text-muted-foreground mt-2 pb-6">
          {!pendingVerification && (
            <div>
              Already have an account?{" "}
              <Link
                // Preserve query parameters when navigating back to sign-in
                href={clientId ? `/sign-in?client_id=${clientId}` : "/sign-in"}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen w-full items-center justify-center p-4 overflow-hidden bg-linear-to-br from-indigo-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
          <Loader />
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
