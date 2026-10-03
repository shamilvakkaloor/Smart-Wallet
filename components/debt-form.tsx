"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export type EditableDebt = { id: string; updatedAt: string; personId: string; categoryId: string; currencyId: string; accountId: string; action: string; amount: number; transactionDate: string; dueDate: string; description: string; notes: string };
type Props = { people: { id: string; name: string }[]; categories: { id: string; name: string }[]; currencies: { id: string; code: string }[]; accounts: { id: string; accountName: string; currencyId: string }[]; entry?: EditableDebt };
export function DebtForm({ people, categories, currencies, accounts, entry }: Props) {
  const router = useRouter(); const [currencyId, setCurrency] = useState(entry?.currencyId ?? currencies[0]?.id ?? ""); const [accountId,setAccountId] = useState(entry?.accountId ?? ""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget);
    const payload = { ...Object.fromEntries(form), amount: Number(form.get("amount")), currencyId, accountId, updatedAt: entry?.updatedAt, confirmOverpayment: false };
    setBusy(true); setError("");
    try {
      const send = () => fetch(entry ? `/api/debt/${entry.id}` : "/api/debt", { method: entry ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      let response = await send(); let result = await response.json();
      if (!response.ok && result.error === "OVERPAYMENT_CONFIRMATION_REQUIRED") {
        if (!window.confirm("This change would leave repayments greater than the recorded loan for the affected person and currency. Save this correction anyway?")) { setError("Not saved. Review the loan and repayment amounts."); return; }
        payload.confirmOverpayment = true; response = await send(); result = await response.json();
      }
      if (!response.ok) { setError(result.error ?? "Could not save debt entry."); return; }
      router.push("/debt"); router.refresh();
    } catch { setError("Could not reach the server. Please try again."); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="card"><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
    <div><label htmlFor="debt-person">Person</label><select id="debt-person" name="personId" defaultValue={entry?.personId ?? ""} required><option value="">Select person</option>{people.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></div>
    <div><label htmlFor="debt-action">Action</label><select id="debt-action" name="action" defaultValue={entry?.action ?? "MONEY_GIVEN"} required><option value="MONEY_GIVEN">Money Given</option><option value="MONEY_RECEIVED_BACK">Money Received Back</option><option value="MONEY_BORROWED">Money Borrowed</option><option value="MONEY_PAID_BACK">Money Paid Back</option></select></div>
    <div><label htmlFor="debt-category">Category</label><select id="debt-category" name="categoryId" defaultValue={entry?.categoryId ?? ""} required><option value="">Select category</option>{categories.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></div>
    <div><label htmlFor="debt-currency">Currency</label><select id="debt-currency" value={currencyId} onChange={e => { setCurrency(e.target.value); setAccountId(""); }}>{currencies.map(c => <option value={c.id} key={c.id}>{c.code}</option>)}</select></div>
    <div><label htmlFor="debt-account">Account</label><select id="debt-account" name="accountId" required value={accountId} onChange={e => setAccountId(e.target.value)}><option value="">Select account</option>{accounts.filter(a => a.currencyId === currencyId).map(a => <option value={a.id} key={a.id}>{a.accountName}</option>)}</select></div>
    <div><label htmlFor="debt-amount">Amount</label><input id="debt-amount" name="amount" inputMode="decimal" type="number" min="0.0001" step="0.0001" defaultValue={entry?.amount} required/></div>
    <div><label htmlFor="debt-date">Date</label><input id="debt-date" name="transactionDate" type="date" defaultValue={entry?.transactionDate ?? new Date().toISOString().slice(0,10)} required/></div>
    <div><label htmlFor="debt-due">Due date</label><input id="debt-due" name="dueDate" type="date" defaultValue={entry?.dueDate}/></div>
    <div className="sm:col-span-2"><label htmlFor="debt-description">Description</label><input id="debt-description" name="description" maxLength={200} defaultValue={entry?.description} required/></div>
    <div className="sm:col-span-2"><label htmlFor="debt-notes">Notes</label><textarea id="debt-notes" name="notes" maxLength={5000} rows={2} defaultValue={entry?.notes}/></div>
    {error && <p role="alert" className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
    <div className="flex gap-2 sm:col-span-2"><button className="btn-primary">{busy ? "Saving…" : entry ? "Save changes" : "Save debt entry"}</button>{entry && <Link className="btn-secondary" href="/debt">Cancel</Link>}</div>
  </fieldset></form>;
}
