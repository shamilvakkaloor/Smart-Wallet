"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function RestoreEntryButton({ id, reference, updatedAt }: { id: string; reference: string; updatedAt: string }) {
 const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
 async function restore() {
  if (busy || !window.confirm(`Restore ${reference}? Its original amount will count in balances and reports again. Check that you have not already entered a replacement.`)) return;
  setBusy(true); setError("");
  try {
   const res = await fetch(`/api/entries/${id}/restore`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updatedAt }) });
   const result = await res.json();
   if (!res.ok) { setError(result.error ?? "Could not restore entry."); return; }
   router.refresh();
  } catch { setError("Could not confirm restoration. Refresh this entry to check its status."); }
  finally { setBusy(false); }
 }
 return <div><button type="button" className="btn-primary" disabled={busy} onClick={restore}>{busy ? "Restoring…" : "Restore entry"}</button>{error && <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>}</div>;
}
