import { Prisma, type DebtTransaction } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { makeReference } from "@/lib/reference";
import { debtEntrySchema } from "@/validation/finance";
type DebtData = z.infer<typeof debtEntrySchema>;
const snapshot = (v: unknown) => JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;

export function worsensOverpayment(prior: Pick<DebtTransaction, "personId" | "currencyId" | "action" | "amount">[], data: Pick<DebtTransaction, "personId" | "currencyId" | "action"> & { amount: number }, before?: DebtTransaction) {
  const pairs = new Map<string, { personId: string; currencyId: string }>();
  for (const row of [data, ...(before ? [before] : [])]) pairs.set(`${row.personId}:${row.currencyId}`, row);
  for (const pair of pairs.values()) {
    for (const [opened, closed] of [["MONEY_GIVEN", "MONEY_RECEIVED_BACK"], ["MONEY_BORROWED", "MONEY_PAID_BACK"]]) {
      const effect = (row: { personId: string; currencyId: string; action: string; amount: Prisma.Decimal | number }) => row.personId !== pair.personId || row.currencyId !== pair.currencyId ? new Prisma.Decimal(0) : row.action === opened ? new Prisma.Decimal(row.amount) : row.action === closed ? new Prisma.Decimal(row.amount).negated() : new Prisma.Decimal(0);
      const base = prior.reduce((sum, row) => sum.plus(effect(row)), new Prisma.Decimal(0));
      const oldBalance = base.plus(before ? effect(before) : 0);
      const nextBalance = base.plus(effect(data));
      if (nextBalance.isNegative() && nextBalance.lessThan(oldBalance)) return true;
    }
  }
  return false;
}
async function validate(tx: Prisma.TransactionClient, data: DebtData, before?: DebtTransaction) {
  const [category, account, person, currency] = await Promise.all([
    tx.debtCategory.findUniqueOrThrow({ where: { id: data.categoryId } }), tx.account.findUniqueOrThrow({ where: { id: data.accountId } }),
    tx.person.findUniqueOrThrow({ where: { id: data.personId } }), tx.currency.findUniqueOrThrow({ where: { id: data.currencyId } }),
  ]);
  if (category.status !== "ACTIVE" && category.id !== before?.categoryId) throw new Error("Choose an active debt category.");
  if (person.status !== "ACTIVE" && person.id !== before?.personId) throw new Error("Choose an active person.");
  if (account.status !== "ACTIVE" && account.id !== before?.accountId) throw new Error("Choose an active account.");
  if (currency.status !== "ACTIVE" && currency.id !== before?.currencyId) throw new Error("Choose an active currency.");
  if (account.currencyId !== data.currencyId) throw new Error("The account and debt currency must match.");
  const pairs = [{ personId: data.personId, currencyId: data.currencyId }];
  if (before) pairs.push({ personId: before.personId, currencyId: before.currencyId });
  const prior = await tx.debtTransaction.findMany({ where: { status: "ACTIVE", id: before ? { not: before.id } : undefined, OR: pairs } });
  if (!data.confirmOverpayment && worsensOverpayment(prior, data, before)) throw new Error("OVERPAYMENT_CONFIRMATION_REQUIRED");
}
const values = (data: DebtData) => ({ personId: data.personId, categoryId: data.categoryId, action: data.action, currencyId: data.currencyId, accountId: data.accountId, amount: data.amount, transactionDate: new Date(data.transactionDate), dueDate: data.dueDate ? new Date(data.dueDate) : null, description: data.description, notes: data.notes });
export async function createDebtEntry(raw: unknown) {
  const data = debtEntrySchema.parse(raw);
  return db.$transaction(async tx => {
    await validate(tx, data);
    const entry = await tx.debtTransaction.create({ data: { ...values(data), reference: makeReference("DEB") } });
    await tx.auditLog.create({ data: { recordType: "DebtTransaction", recordId: entry.id, action: "CREATE", afterData: snapshot(entry), changedBy: process.env.LOGIN_USER ?? "system" } });
    return entry;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
export async function updateDebtEntry(id: string, raw: unknown) {
  const data = debtEntrySchema.parse(raw);
  const { updatedAt } = z.object({ updatedAt: z.string().datetime() }).parse(raw);
  return db.$transaction(async tx => {
    const before = await tx.debtTransaction.findUniqueOrThrow({ where: { id } });
    if (before.status !== "ACTIVE") throw new Error("Deleted debt entries cannot be edited.");
    if (before.updatedAt.getTime() !== new Date(updatedAt).getTime()) throw new Error("This debt entry changed. Reload before editing.");
    await validate(tx, data, before);
    const changed = await tx.debtTransaction.updateMany({ where: { id, status: "ACTIVE", updatedAt: new Date(updatedAt) }, data: { ...values(data), updatedAt: new Date(Math.max(Date.now(), before.updatedAt.getTime()+1)) } });
    if (changed.count !== 1) throw new Error("This debt entry changed. Reload before editing.");
    const after = await tx.debtTransaction.findUniqueOrThrow({ where: { id } });
    await tx.auditLog.create({ data: { recordType: "DebtTransaction", recordId: id, action: "UPDATE", beforeData: snapshot(before), afterData: snapshot(after), changedBy: process.env.LOGIN_USER ?? "system" } });
    return after;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function voidDebtEntry(id: string, raw: unknown) {
  const { updatedAt, confirmOverpayment } = z.object({ updatedAt: z.string().datetime(), confirmOverpayment: z.boolean().default(false) }).parse(raw);
  return db.$transaction(async tx => {
    const before = await tx.debtTransaction.findUniqueOrThrow({ where: { id } });
    if (before.status === "VOIDED") return before;
    if (before.updatedAt.getTime() !== new Date(updatedAt).getTime()) throw new Error("This debt entry changed. Reload before voiding.");
    const prior = await tx.debtTransaction.findMany({ where: { status: "ACTIVE", id: { not: id }, personId: before.personId, currencyId: before.currencyId } });
    const removed = { ...before, amount: 0, transactionDate: before.transactionDate.toISOString().slice(0,10), dueDate: "", notes: before.notes ?? "" };
    if (!confirmOverpayment && worsensOverpayment(prior, removed, before)) throw new Error("OVERPAYMENT_CONFIRMATION_REQUIRED");
    const changed = await tx.debtTransaction.updateMany({ where: { id, status: "ACTIVE", updatedAt: new Date(updatedAt) }, data: { status: "VOIDED", updatedAt: new Date(Math.max(Date.now(), before.updatedAt.getTime()+1)) } });
    if (changed.count !== 1) throw new Error("This debt entry changed. Reload before voiding.");
    const after = await tx.debtTransaction.findUniqueOrThrow({ where: { id } });
    await tx.auditLog.create({ data: { recordType: "DebtTransaction", recordId: id, action: "VOID", beforeData: snapshot(before), afterData: snapshot(after), changedBy: process.env.LOGIN_USER ?? "system" } });
    return after;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
