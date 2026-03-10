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
        // Optional: Provide custom redirect logic here if needed
        router.push("/");
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
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50/50 dark:bg-black">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50/50 p-4 dark:bg-zinc-950">
      <Card className="w-full max-w-[400px] shadow-xl border-0 md:border md:dark:border-zinc-800 bg-card rounded-2xl md:rounded-xl">
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
              href={clientId ? `/sign-up?client_id=${clientId}` : "/sign-up"}
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
        <div className="flex h-screen w-screen items-center justify-center bg-gray-50/50 dark:bg-black">
          <Loader />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
