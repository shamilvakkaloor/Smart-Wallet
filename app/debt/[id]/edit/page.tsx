import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DebtForm } from "@/components/debt-form";
import { PageHeader } from "@/components/page-header";
export default async function EditDebtPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await auth())?.user) notFound();
  const { id } = await params; const entry = await db.debtTransaction.findUnique({ where: { id } });
  if (!entry || entry.status !== "ACTIVE") notFound();
  const [people,categories,currencies,accounts,audit] = await Promise.all([
    db.person.findMany({ where: { OR: [{ status: "ACTIVE" }, { id: entry.personId }] }, orderBy: { name: "asc" } }),
    db.debtCategory.findMany({ where: { OR: [{ status: "ACTIVE" }, { id: entry.categoryId }] }, orderBy: { name: "asc" } }),
    db.currency.findMany({ where: { OR: [{ status: "ACTIVE" }, { id: entry.currencyId }] }, orderBy: { code: "asc" } }),
    db.account.findMany({ where: { OR: [{ status: "ACTIVE" }, { id: entry.accountId }] }, orderBy: { accountName: "asc" } }),
    db.auditLog.findMany({ where: { recordType: "DebtTransaction", recordId: id }, orderBy: { changedAt: "desc" }, take: 20 }),
  ]);
  return <><PageHeader title={`Edit ${entry.reference}`} description="Correct a debt entry. Balances update automatically and the previous values stay in audit history."/><div className="max-w-3xl"><DebtForm people={people.map(p=>({id:p.id,name:p.name}))} categories={categories.map(c=>({id:c.id,name:c.name+(c.status !== "ACTIVE" ? " (archived)" : "")}))} currencies={currencies.map(c=>({id:c.id,code:c.code}))} accounts={accounts.map(a=>({id:a.id,accountName:a.accountName,currencyId:a.currencyId}))} entry={{ id, updatedAt:entry.updatedAt.toISOString(),personId:entry.personId,categoryId:entry.categoryId,currencyId:entry.currencyId,accountId:entry.accountId,action:entry.action,amount:Number(entry.amount),transactionDate:entry.transactionDate.toISOString().slice(0,10),dueDate:entry.dueDate?.toISOString().slice(0,10) ?? "",description:entry.description,notes:entry.notes ?? "" }}/><section className="card mt-6"><h2>Audit history</h2><ul className="mt-4 space-y-3">{audit.map(a=><li key={a.id} className="text-sm"><strong>{a.action}</strong> · {a.changedAt.toLocaleString("en-GB")} · {a.changedBy}</li>)}{!audit.length && <li className="text-muted">No recorded changes.</li>}</ul></section></div></>;
}
