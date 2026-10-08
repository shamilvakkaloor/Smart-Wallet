"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteEntryButton({ id, reference, variant = "delete" }: { id: string; reference: string; variant?: "delete" | "void" }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function remove() {
    if (busy || !window.confirm(`${variant === "void" ? "Void" : "Delete"} ${reference}? It will be excluded from balances and reports. You can restore it from Deleted entries. Unsaved edits will not be saved.`)) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) { setError(result.error ?? "Could not delete entry."); return; }
      router.push("/entries"); router.refresh();
    } catch { setError("Could not reach the server. Try again."); }
    finally { setBusy(false); }
  }
  return <div><button type="button" disabled={busy} onClick={remove} className="btn-secondary text-rose-600">{busy ? (variant === "void" ? "Voiding…" : "Deleting…") : (variant === "void" ? "Void entry" : "Delete entry")}</button>{error && <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>}</div>;
}
