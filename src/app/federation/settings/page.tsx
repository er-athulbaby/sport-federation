"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import EntityLogo from "@/components/EntityLogo";

export default function FederationSettingsPage() {
  const { data: session } = useSession();
  const federationId = session?.user.federationId;
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !federationId) return;

    setUploading(true);
    setError(null);
    const body = new FormData();
    body.append("logo", file);

    const res = await fetch(`/api/federations/${federationId}/logo`, {
      method: "POST",
      body,
    });
    setUploading(false);

    if (!res.ok) {
      setError((await res.json()).error ?? "Could not upload logo");
      return;
    }
    setPreview(`/api/federations/${federationId}/logo?t=${Date.now()}`);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Settings</h1>

      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-5">
        <p className="mb-3 text-sm font-medium text-slate-700">Federation logo</p>
        <div className="mb-4 flex items-center gap-4">
          <EntityLogo src={preview ?? undefined} name={session?.user.name ?? "F"} size={56} />
          <label className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            {uploading ? "Uploading…" : "Upload logo"}
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-slate-400">PNG, JPG, or SVG. Appears in your portal header and on generated documents.</p>
      </div>
    </div>
  );
}
