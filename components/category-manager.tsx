"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string; type?: string; parentId?: string | null };
export function CategoryManager({ kind, categories }: { kind: "normal" | "debt"; categories: Category[] }) {
  const router = useRouter();
  const [type, setType] = useState("EXPENSE");
  const [parentId, setParentId] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [rename, setRename] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(method: string, values: object) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/categories", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, ...values }) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error ?? "Could not save category."); return; }
      setEditing(null);
      if (method === "POST") setName("");
      if (method === "DELETE") { setParentId(""); setMessage("Category deleted. Existing entries retain their category history."); }
      router.refresh();
    } catch { setMessage("Could not reach the server. Try again."); }
    finally { setBusy(false); }
  }
  const ordered = kind === "debt" ? categories : categories.filter(c => !c.parentId).flatMap(parent => [parent, ...categories.filter(c => c.parentId === parent.id)]);
  return <section className="card">
    <h2 className="mb-3 font-semibold">{kind === "debt" ? "Debt categories" : "Categories"}</h2>
    <p className="mb-4 text-sm text-slate-500">{kind === "normal" ? "Choose a category first when recording an entry. A subcategory is optional. Delete subcategories before their parent." : "Labels for loans, borrowing, and repayments."}</p>
    <fieldset disabled={busy} className="min-w-0">
      <div className="mb-5 max-h-80 overflow-y-auto divide-y dark:divide-slate-800">
        {ordered.map(c => <div key={c.id} className={`py-3 ${c.parentId ? "pl-5" : ""}`}>
          {editing === c.id ? <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); void save("PATCH", { id: c.id, name: rename }); }}>
            <input aria-label={`Rename ${c.name}`} value={rename} onChange={e => setRename(e.target.value)} required maxLength={100}/>
            <button className="btn-primary">Save</button><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
          </form> : <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>{c.parentId ? "↳ " : ""}{c.name} <span className="text-xs text-slate-400">{c.type}</span></span>
            <div className="flex gap-3"><button type="button" className="text-emerald-600" aria-label={`Edit ${c.name}`} onClick={() => { setEditing(c.id); setRename(c.name); setMessage(""); }}>Edit</button>
              <button type="button" className="text-rose-600" aria-label={`Delete ${c.name}`} onClick={() => { if (window.confirm(`Delete ${c.name}? It will no longer be offered for new entries. Existing entries keep their category.`)) void save("DELETE", { id: c.id }); }}>Delete</button></div>
          </div>}
        </div>)}
        {!ordered.length && <p className="text-sm text-slate-500">No categories yet.</p>}
      </div>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); void save("POST", { name, type, parentId: parentId || null }); }}>
        <label className="text-sm">Name<input value={name} onChange={e => setName(e.target.value)} required maxLength={100}/></label>
        {kind === "normal" && <>
          <label className="text-sm">Type<select value={type} onChange={e => { setType(e.target.value); setParentId(""); }}><option>EXPENSE</option><option>INCOME</option></select></label>
          <label className="text-sm sm:col-span-2">Parent category<select value={parentId} onChange={e => setParentId(e.target.value)}><option value="">None — create a main category</option>{categories.filter(c => !c.parentId && c.type === type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        </>}
        <button className="btn-secondary sm:col-span-2">{busy ? "Saving…" : "Add category"}</button>
      </form>
    </fieldset>
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
  </section>;
}
