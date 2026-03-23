"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage({
  params,
}: {
  params: { secret: string };
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const secret = params.secret;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-path-secret": secret,
      },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Invalid credentials");
      return;
    }

    router.push(`/admin/${secret}/dashboard`);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard Login</h1>
        <p className="text-slate-300 text-sm mb-4">
          Enter credentials for secure admin access.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-slate-300">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
              required
            />
          </div>
          {error && <div className="text-rose-400 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
