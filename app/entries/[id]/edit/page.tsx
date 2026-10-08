import { DeleteEntryButton } from "@/components/delete-entry-button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { EntryForm, type EditableEntry } from "@/components/entry-form";

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await auth())?.user) notFound();
  const { id } = await params;
  const entry = await db.transaction.findUnique({ where: { id }, include: { allocations: true, transfer: true, exchange: true } });
  if (!entry) notFound();
  if (entry.status !== "ACTIVE") return <><PageHeader title="Entry deleted" description="Deleted entries remain available in history and cannot be edited." /><Link href={`/entries/${id}`} className="btn-secondary">View history</Link></>;
  const [accounts, categories, currencies] = await Promise.all([
    db.account.findMany({ where: { status: "ACTIVE" }, include: { currency: true }, orderBy: { accountName: "asc" } }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.currency.findMany({ where: { status: "ACTIVE" }, orderBy: { code: "asc" } }),
  ]);
  const initial: EditableEntry = {
    id: entry.id, type: entry.type, updatedAt: entry.updatedAt.toISOString(), transactionDate: entry.transactionDate.toISOString().slice(0, 10), amount: Number(entry.amount),
    currencyId: entry.currencyId, categoryId: entry.categoryId, description: entry.description, notes: entry.notes,
    allocations: entry.allocations.map((line) => ({ accountId: line.accountId, amount: Number(line.amount) })),
    transfer: entry.transfer ? { sourceAccountId: entry.transfer.sourceAccountId, destinationAccountId: entry.transfer.destinationAccountId, amount: Number(entry.transfer.amount) } : null,
    exchange: entry.exchange ? { sourceAccountId: entry.exchange.sourceAccountId, destinationAccountId: entry.exchange.destinationAccountId, sourceAmount: Number(entry.exchange.sourceAmount), exchangeRate: Number(entry.exchange.exchangeRate), actualDestinationAmount: Number(entry.exchange.actualDestinationAmount) } : null,
  };
  return <><PageHeader title={`Edit ${entry.reference}`} description="Changes update your balances and keep the previous version in audit history." /><EntryForm entry={initial} initialType={entry.type} accounts={accounts.map((a) => ({ id: a.id, accountName: a.accountName, currencyId: a.currencyId, currency: { code: a.currency.code } }))} categories={categories.map((c) => ({ id: c.id, name: c.name, type: c.type, parentId: c.parentId, status: c.status }))} currencies={currencies.map((c) => ({ id: c.id, code: c.code }))} /><section className="card mt-6"><h2 className="font-semibold">Void this entry</h2><p className="mb-4 mt-2 text-sm text-muted">Exclude this entry from balances and reports while keeping its history. You can recover it from Deleted entries. Unsaved edits will not be saved.</p><DeleteEntryButton id={entry.id} reference={entry.reference} variant="void" /></section></>;
}
