"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Account = { id: string; accountName: string; currencyId: string; currency: { code: string } };
export type EntryCategory = { id: string; name: string; type: "INCOME" | "EXPENSE"; parentId: string | null; status?: string };
type Currency = { id: string; code: string };
export type EditableEntry = {
  id: string; type: string; updatedAt: string; transactionDate: string; amount: number;
  currencyId: string | null; categoryId: string | null; description: string; notes: string | null;
  allocations: { accountId: string; amount: number }[];
  transfer: { sourceAccountId: string; destinationAccountId: string; amount: number } | null;
  exchange: { sourceAccountId: string; destinationAccountId: string; sourceAmount: number; exchangeRate: number; actualDestinationAmount: number } | null;
};

export function EntryForm({ initialType, accounts, categories, currencies, entry }: { initialType: string; accounts: Account[]; categories: EntryCategory[]; currencies: Currency[]; entry?: EditableEntry }) {
  const router = useRouter();
  const [type, setType] = useState(["INCOME", "EXPENSE", "TRANSFER", "EXCHANGE"].includes(initialType) ? initialType : "EXPENSE");
  const [currencyId, setCurrencyId] = useState(entry?.currencyId ?? currencies[0]?.id ?? "");
  const selectedCategory = categories.find((c) => c.id === entry?.categoryId);
  const [parentId, setParentId] = useState(selectedCategory?.parentId ?? selectedCategory?.id ?? "");
  const [subcategoryId, setSubcategoryId] = useState(selectedCategory?.parentId ? selectedCategory.id : "");
  const [total, setTotal] = useState(entry ? String(entry.amount) : "");
  const [allocations, setAllocations] = useState(entry?.allocations.length ? entry.allocations.map((a) => ({ accountId: a.accountId, amount: String(a.amount) })) : [{ accountId: "", amount: "" }]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const normal = type === "INCOME" || type === "EXPENSE";
  const split = allocations.length > 1;
  const eligible = useMemo(() => accounts.filter((a) => a.currencyId === currencyId), [accounts, currencyId]);
  const visibleCategories = categories.filter((c) => c.type === type && (c.status !== "INACTIVE" || c.id === entry?.categoryId || c.id === selectedCategory?.parentId));
  const parents = visibleCategories.filter((c) => !c.parentId);
  const children = visibleCategories.filter((c) => c.parentId === parentId);
  const splitTotal = allocations.reduce((sum, line) => sum + Number(line.amount || 0), 0);
  const remaining = Number(total || 0) - splitTotal;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const f = new FormData(e.currentTarget);
    const common = { type, transactionDate: f.get("transactionDate"), description: f.get("description"), notes: f.get("notes"), updatedAt: entry?.updatedAt };
    let payload: Record<string, unknown>;
    if (normal) payload = { ...common, amount: Number(total), currencyId, parentCategoryId: parentId, categoryId: subcategoryId || parentId, allocations: allocations.map((a) => ({ accountId: a.accountId, amount: split ? Number(a.amount) : Number(total) })) };
    else if (type === "TRANSFER") payload = { ...common, sourceAccountId: f.get("sourceAccountId"), destinationAccountId: f.get("destinationAccountId"), amount: Number(f.get("amount")) };
    else payload = { ...common, sourceAccountId: f.get("sourceAccountId"), destinationAccountId: f.get("destinationAccountId"), sourceAmount: Number(f.get("sourceAmount")), exchangeRate: Number(f.get("exchangeRate")), actualDestinationAmount: Number(f.get("actualDestinationAmount")) };
    try {
      const res = await fetch(entry ? `/api/entries/${entry.id}` : "/api/entries", { method: entry ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const out = await res.json();
      if (!res.ok) { setError(out.error ?? "Could not save."); return; }
      router.push(`/entries/${out.id}`); router.refresh();
    } catch { setError("Could not reach the server. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="card max-w-3xl space-y-5">
    <fieldset disabled={busy} className="space-y-5">
      <div><label>Entry type</label>{entry ? <p className="font-semibold">{type[0] + type.slice(1).toLowerCase()}</p> : <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{["INCOME", "EXPENSE", "TRANSFER", "EXCHANGE"].map((v) => <button type="button" onClick={() => { setType(v); setParentId(""); setSubcategoryId(""); }} key={v} className={type === v ? "btn-primary" : "btn-secondary"}>{v[0] + v.slice(1).toLowerCase()}</button>)}</div>}</div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="entry-date">Date</label><input id="entry-date" name="transactionDate" type="date" defaultValue={entry?.transactionDate ?? new Date().toISOString().slice(0, 10)} required /></div>{normal && <div><label htmlFor="entry-currency">Currency</label><select id="entry-currency" value={currencyId} onChange={(e) => { setCurrencyId(e.target.value); setAllocations([{ accountId: "", amount: "" }]); }}>{currencies.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}</select></div>}</div>
      {normal && <>
        <div><label htmlFor="entry-amount">{split ? "Total amount" : "Amount"}</label><input id="entry-amount" name="amount" type="number" min="0.0001" step="0.0001" value={total} onChange={(e) => setTotal(e.target.value)} required />{split && <p className="mt-1 text-xs text-slate-500">The value of this whole entry. The account amounts below must add up to it.</p>}</div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="entry-category">Category</label><select id="entry-category" value={parentId} required onChange={(e) => { setParentId(e.target.value); setSubcategoryId(""); }}><option value="">Select category</option>{parents.map((c) => <option key={c.id} value={c.id}>{c.name}{c.status === "INACTIVE" ? " (deleted)" : ""}</option>)}</select></div>{children.length > 0 && <div><label htmlFor="entry-subcategory">Subcategory (optional)</label><select id="entry-subcategory" value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)}><option value="">None — use the parent category</option>{children.map((c) => <option key={c.id} value={c.id}>{c.name}{c.status === "INACTIVE" ? " (deleted)" : ""}</option>)}</select></div>}</div>
        <div><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-medium">{split ? "Split between accounts" : type === "EXPENSE" ? "Pay from" : "Receive into"}</h2><button type="button" className="text-sm font-semibold text-emerald-600" onClick={() => setAllocations([...allocations.map((a) => split ? a : { ...a, amount: total }), { accountId: "", amount: "" }])}>+ Split across accounts</button></div>
          {allocations.map((line, i) => <div key={i} className={`mb-2 grid gap-2 ${split ? "grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" : "grid-cols-1"}`}><div><label htmlFor={`account-${i}`} className="sr-only">Account {i + 1}</label><select id={`account-${i}`} required value={line.accountId} onChange={(e) => setAllocations(allocations.map((a, n) => n === i ? { ...a, accountId: e.target.value } : a))}><option value="">Select account</option>{eligible.map((a) => <option key={a.id} value={a.id} disabled={allocations.some((other, n) => n !== i && other.accountId === a.id)}>{a.accountName}</option>)}</select></div>{split && <><div><label htmlFor={`split-${i}`} className="sr-only">Account {i + 1} amount</label><input id={`split-${i}`} required type="number" min="0.0001" step="0.0001" placeholder="Account amount" value={line.amount} onChange={(e) => setAllocations(allocations.map((a, n) => n === i ? { ...a, amount: e.target.value } : a))} /></div><button type="button" aria-label={`Remove account ${i + 1}`} className="btn-secondary px-3" onClick={() => setAllocations(allocations.filter((_, n) => n !== i))}>×</button></>}</div>)}
          {split ? <p aria-live="polite" className={`text-sm ${Math.abs(remaining) < 0.000001 ? "text-emerald-600" : "text-amber-700 dark:text-amber-300"}`}>Allocated: {splitTotal.toFixed(4).replace(/\.?0+$/, "")} · Remaining: {remaining.toFixed(4).replace(/\.?0+$/, "") || "0"}</p> : <p className="mt-1 text-xs text-slate-500">The full amount is assigned to this account automatically.</p>}
        </div>
      </>}
      {type === "TRANSFER" && <div className="grid gap-4 sm:grid-cols-3"><AccountSelect name="sourceAccountId" label="From" accounts={accounts} value={entry?.transfer?.sourceAccountId} /><AccountSelect name="destinationAccountId" label="To" accounts={accounts} value={entry?.transfer?.destinationAccountId} /><div><label htmlFor="transfer-amount">Amount</label><input id="transfer-amount" name="amount" type="number" min="0.0001" step="0.0001" defaultValue={entry?.amount} required /></div></div>}
      {type === "EXCHANGE" && <><div className="grid gap-4 sm:grid-cols-2"><AccountSelect name="sourceAccountId" label="Source account" accounts={accounts} value={entry?.exchange?.sourceAccountId} /><AccountSelect name="destinationAccountId" label="Destination account" accounts={accounts} value={entry?.exchange?.destinationAccountId} /></div><div className="grid gap-4 sm:grid-cols-3"><div><label htmlFor="source-amount">Source amount</label><input id="source-amount" name="sourceAmount" type="number" min="0.0001" step="0.0001" defaultValue={entry?.exchange?.sourceAmount} required /></div><div><label htmlFor="exchange-rate">Exchange rate</label><input id="exchange-rate" name="exchangeRate" type="number" min="0.00000001" step="0.00000001" defaultValue={entry?.exchange?.exchangeRate} required /></div><div><label htmlFor="actual-amount">Actual received</label><input id="actual-amount" name="actualDestinationAmount" type="number" min="0.0001" step="0.0001" defaultValue={entry?.exchange?.actualDestinationAmount} required /></div></div></>}
      <div><label htmlFor="entry-description">Description</label><input id="entry-description" name="description" maxLength={200} defaultValue={entry?.description} required placeholder="What was this for?" /></div><div><label htmlFor="entry-notes">Notes</label><textarea id="entry-notes" name="notes" rows={3} defaultValue={entry?.notes ?? ""} placeholder="Optional details" /></div>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}<div className="flex gap-2"><button className="btn-primary">{busy ? "Saving…" : entry ? "Save changes" : "Save entry"}</button><button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button></div>
    </fieldset>
  </form>;
}

function AccountSelect({ name, label, accounts, value }: { name: string; label: string; accounts: Account[]; value?: string }) {
  return <div><label htmlFor={name}>{label}</label><select id={name} name={name} defaultValue={value ?? ""} required><option value="">Select account</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.accountName} ({a.currency.code})</option>)}</select></div>;
}
