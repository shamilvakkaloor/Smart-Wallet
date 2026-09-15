import { PageHeader } from "@/components/page-header";
import { EntryForm } from "@/components/entry-form";
import { db } from "@/lib/db";
import { serialize } from "@/lib/format";

export default async function NewEntryPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const [{ type }, accounts, categories, currencies] = await Promise.all([searchParams, db.account.findMany({ where: { status: "ACTIVE" }, include: { currency: true }, orderBy: { accountName: "asc" } }), db.category.findMany({ where: { status: "ACTIVE" }, orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }] }), db.currency.findMany({ where: { status: "ACTIVE" }, orderBy: { code: "asc" } })]);
  return <><PageHeader title="New entry" description="Income, expense, transfer, or currency exchange"/><EntryForm initialType={type ?? "EXPENSE"} accounts={serialize(accounts)} categories={serialize(categories)} currencies={serialize(currencies)}/></>;
}
