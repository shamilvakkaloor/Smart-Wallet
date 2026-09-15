import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  if (!(await auth())) return new Response("Unauthorized", { status: 401 });
  const [currencies, accounts, openingBalances, categories, transactions, transfers, exchanges, people, debtCategories, debtTransactions, budgets, exchangeRates, auditLogs, settings] = await Promise.all([db.currency.findMany(), db.account.findMany(), db.openingBalance.findMany(), db.category.findMany(), db.transaction.findMany({ include: { allocations: true } }), db.transfer.findMany(), db.exchange.findMany(), db.person.findMany(), db.debtCategory.findMany(), db.debtTransaction.findMany(), db.budget.findMany(), db.exchangeRate.findMany(), db.auditLog.findMany(), db.appSetting.findMany()]);
  const payload = { format: "smart-wallet-backup", version: 1, createdAt: new Date().toISOString(), data: { currencies, accounts, openingBalances, categories, transactions, transfers, exchanges, people, debtCategories, debtTransactions, budgets, exchangeRates, auditLogs, settings } };
  return new Response(JSON.stringify(payload, (_key, value) => typeof value === "bigint" ? value.toString() : value, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="smart-wallet-backup-${new Date().toISOString().slice(0,10)}.json"` } });
}
