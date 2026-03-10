"use client";

import * as React from "react";
import { useSignIn } from "@clerk/nextjs";
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

function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientId = searchParams.get("client_id");
  const redirectUrl =
    searchParams.get("redirect_url") || searchParams.get("redirect_uri");

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        // Let Clerk handle the SSO Identity Provider redirect, fallback to roots if no redirect url
        if (redirectUrl) {
          router.push(redirectUrl);
        } else {
          router.push("/");
        }
      } else {
        console.error(JSON.stringify(result, null, 2));
        setError("Unable to complete sign in. Please try again.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(
        err.errors?.[0]?.message || "Something went wrong. Please try again.",
      );
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
            Welcome back
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Enter your email and password to sign in
            {clientId && (
              <span className="block mt-1 text-xs opacity-50">
                Connecting to app: {clientId}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                {loading ? "Please wait..." : "Sign in"}
              </Button>
            </form>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center text-sm text-muted-foreground mt-2 pb-6">
          <div>
            Don&apos;t have an account?{" "}
            <Link
              href={`/sign-up?${new URLSearchParams(Object.fromEntries(searchParams.entries())).toString()}`}
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen w-full items-center justify-center p-4 overflow-hidden bg-linear-to-br from-indigo-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
          <Loader />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
