"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthenticatePage() {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const res = await fetch("/api/auth/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, redirect_uri: redirectUri }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setSuccess("Client validated and linked. Redirecting...");
    window.location.href = data.redirect_uri;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="w-full max-w-xl bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Authenticate a Client</h1>
            <p className="text-slate-300 text-sm">
              Enter your app client details exactly as registered below.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="rounded px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600"
          >
            Home
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-slate-300 text-sm">Client ID</span>
            <input
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
              placeholder="example-client-1"
            />
          </label>

          <label className="block">
            <span className="text-slate-300 text-sm">Redirect URI</span>
            <input
              value={redirectUri}
              onChange={(e) => setRedirectUri(e.target.value)}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
              placeholder="https://app.example.com/callback"
            />
          </label>

          {error && <div className="text-red-400 text-sm">{error}</div>}
          {success && <div className="text-emerald-400 text-sm">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Validate and Link Client"}
          </button>
        </form>

        <div className="mt-4 text-xs text-slate-400">
          Note: You must be signed in through Clerk first. If you are not signed
          in, go to{" "}
          <Link className="text-indigo-300" href="/sign-in">
            Sign In
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
