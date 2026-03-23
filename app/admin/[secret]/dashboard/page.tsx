"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ClientItem = {
  id: string;
  client_id: string | null;
  redirect_uri: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
};

export default function AdminDashboardPage({
  params,
}: {
  params: { secret: string };
}) {
  const router = useRouter();
  const secret = params.secret;
  const [clientId, setClientId] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      const res = await fetch("/api/admin/clients", {
        headers: { "x-admin-path-secret": secret },
      });
      if (!res.ok) {
        router.push(`/admin/${secret}/login`);
        return;
      }
      const data = await res.json();
      setClients(data.clients || []);
      setLoading(false);
    };

    fetchClients();
  }, [router, secret]);

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!clientId || !redirectUri) {
      setError("client_id and redirect_uri are required");
      return;
    }

    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-path-secret": secret,
      },
      body: JSON.stringify({ client_id: clientId, redirect_uri: redirectUri }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setSuccess("Client saved");
    setClientId("");
    setRedirectUri("");
    const list = await fetch("/api/admin/clients", {
      headers: { "x-admin-path-secret": secret },
    });
    if (list.ok) {
      const parsed = await list.json();
      setClients(parsed.clients || []);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push(`/admin/${secret}/login`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-700 rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-300 text-sm">
              Manage allowed clients and redirect URIs.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded bg-rose-500 px-3 py-2 text-sm"
          >
            Logout
          </button>
        </div>

        <form
          onSubmit={handleAddClient}
          className="grid gap-2 md:grid-cols-[1fr_1fr_auto] mb-3"
        >
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="client_id"
            className="rounded border border-slate-600 bg-slate-800 px-2 py-2 text-slate-100"
          />
          <input
            value={redirectUri}
            onChange={(e) => setRedirectUri(e.target.value)}
            placeholder="redirect_uri"
            className="rounded border border-slate-600 bg-slate-800 px-2 py-2 text-slate-100"
          />
          <button
            type="submit"
            className="rounded bg-indigo-500 px-3 py-2 text-white hover:bg-indigo-400"
          >
            Add/Update
          </button>
        </form>

        {error && <div className="text-red-300 text-sm mb-2">{error}</div>}
        {success && (
          <div className="text-emerald-300 text-sm mb-2">{success}</div>
        )}

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-3">
          <div className="flex justify-between text-xs uppercase text-slate-400 mb-2">
            <div className="w-1/5">Client ID</div>
            <div className="w-2/5">Redirect URI</div>
            <div className="w-1/5">Linked User</div>
            <div className="w-1/5">Created</div>
          </div>
          {loading ? (
            <div className="text-slate-300">Loading...</div>
          ) : (
            clients.map((client) => (
              <div
                key={client.id}
                className="text-slate-200 py-1 border-t border-slate-700 text-xs md:text-sm"
              >
                <div className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-2">
                  <div className="truncate">{client.client_id || "-"}</div>
                  <div className="truncate">{client.redirect_uri || "-"}</div>
                  <div className="truncate">{client.user_id || "none"}</div>
                  <div className="truncate">
                    {new Date(client.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
