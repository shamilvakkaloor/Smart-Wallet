"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AttachmentUpload({ transactionId }: { transactionId: string }) {
  const router = useRouter(); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); setBusy(true); setMessage(""); const data = new FormData(e.currentTarget); data.set("transactionId", transactionId); const response = await fetch("/api/attachments", { method: "POST", body: data }); const result = await response.json(); setBusy(false); if (!response.ok) return setMessage(result.error); e.currentTarget.reset(); setMessage("Uploaded."); router.refresh(); }
  return <form onSubmit={submit} className="mt-4"><label>Attach receipt or document</label><div className="flex gap-2"><input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required/><button disabled={busy} className="btn-secondary">{busy ? "Uploading…" : "Upload"}</button></div>{message && <p className="mt-2 text-xs text-slate-500">{message}</p>}</form>;
}
