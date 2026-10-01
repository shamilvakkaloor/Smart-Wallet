"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteEntryButton({ id, reference }: { id: string; reference: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function remove() {
    if (!window.confirm(`Delete ${reference}? It will be removed from balances and reports. A copy remains in deleted history.`)) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) { setError(result.error ?? "Could not delete entry."); return; }
      router.push("/entries"); router.refresh();
    } catch { setError("Could not reach the server. Try again."); }
    finally { setBusy(false); }
  }
  return <div><button type="button" disabled={busy} onClick={remove} className="btn-secondary text-rose-600">{busy ? "Deleting…" : "Delete entry"}</button>{error && <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>}</div>;
}
