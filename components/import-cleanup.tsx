"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function ImportCleanup() {
 const router = useRouter();
 const [preview, setPreview] = useState<{count: number; version: string} | null>(null);
 const [confirmation, setConfirmation] = useState("");
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState("");
 const [message, setMessage] = useState("");
 async function review() {
  setBusy(true); setError(""); setMessage(""); setPreview(null); setConfirmation("");
  try { const res = await fetch("/api/import/cleanup", { cache: "no-store" }); const data = await res.json(); if (!res.ok) throw new Error(data.error ?? "Could not load imported entries."); setPreview(data); }
  catch(e) { setError(e instanceof Error ? e.message : "Could not load imported entries."); }
  finally { setBusy(false); }
 }
 async function remove() {
  if (busy || !preview?.count || confirmation !== "VOID ALL EXCEL IMPORTS") return;
  setBusy(true); setError("");
  try {
   const res = await fetch("/api/import/cleanup", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: preview.version, confirmation }) });
   const data = await res.json(); if (!res.ok) throw new Error(data.error ?? "Could not void imports.");
   setMessage(`${data.voided} Excel-imported entries voided. Balances and reports have been updated.`); setPreview(null); router.refresh();
  } catch(e) { setPreview(null); setError(e instanceof Error ? e.message : "Could not confirm the result. Review imports again to check their status."); }
  finally { setBusy(false); setConfirmation(""); }
 }
 return <section className="card mt-8 space-y-4"><h2 className="text-lg font-semibold">Remove Excel imports</h2><p className="text-sm text-muted">Void every active Excel-imported entry across all dates and currencies. Manually entered transactions are kept. Voided entries stop counting in balances and reports and can be restored from Deleted entries.</p><button type="button" className="btn-secondary" disabled={busy} onClick={review}>{busy ? "Working…" : "Review all Excel imports"}</button>{preview && (preview.count ? <div className="space-y-3 rounded-xl border border-rose-200 p-4"><p className="font-semibold">{preview.count} imported entries will be voided</p><label className="block text-sm">Type VOID ALL EXCEL IMPORTS to confirm<input className="input mt-2 w-full" value={confirmation} disabled={busy} onChange={e => setConfirmation(e.target.value)} autoComplete="off" /></label><div className="flex flex-wrap gap-3"><button type="button" className="btn-expense" disabled={busy || confirmation !== "VOID ALL EXCEL IMPORTS"} onClick={remove}>Void all Excel imports</button><button type="button" className="btn-secondary" disabled={busy} onClick={() => {setPreview(null); setConfirmation("");}}>Cancel</button></div></div> : <p role="status">No active Excel imports to remove.</p>)}{error && <p role="alert" className="text-sm text-rose-600">{error}</p>}{message && <p role="status" className="text-sm text-emerald-700">{message}</p>}<p className="text-sm text-muted">Original import IDs remain reserved after voiding. To upload corrected replacements, download a fresh template.</p><Link className="text-sm text-emerald-600" href="/entries?status=deleted&source=excel">View deleted Excel imports</Link></section>;
}
