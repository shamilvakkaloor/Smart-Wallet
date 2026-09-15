import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(request: Request) {
  if (!(await auth())) return new Response("Unauthorized", { status: 401 });
  const url = new URL(request.url);
  const from = url.searchParams.get("from"); const to = url.searchParams.get("to");
  const rows = await db.transaction.findMany({ where: { status: "ACTIVE", transactionDate: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } }, include: { category: true, allocations: { include: { account: { include: { currency: true } } } }, transfer: true, exchange: true }, orderBy: { transactionDate: "desc" } });
  const header = ["Reference", "Date", "Type", "Description", "Category", "Amount", "Currency", "Status"];
  const lines = rows.map((r) => [r.reference, r.transactionDate.toISOString().slice(0, 10), r.type, r.description, r.category?.name, r.amount, r.allocations[0]?.account.currency.code ?? "", r.status].map(csvCell).join(","));
  const csv = "\uFEFF" + header.map(csvCell).join(",") + "\n" + lines.join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="smart-wallet-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
