import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { makeReference } from "@/lib/reference";
import { exchangeSchema, normalEntrySchema, transferSchema } from "@/validation/finance";

const actor = () => process.env.LOGIN_USER ?? "system";

export async function createNormalEntry(raw: unknown) {
  const data = normalEntrySchema.parse(raw);
  return db.$transaction(async (tx) => {
    const accounts = await tx.account.findMany({ where: { id: { in: data.allocations.map((x) => x.accountId) }, status: "ACTIVE" } });
    if (accounts.length !== data.allocations.length || accounts.some((a) => a.currencyId !== data.currencyId)) throw new Error("Every allocation must use an active account in the selected currency.");
    const category = await tx.category.findUniqueOrThrow({ where: { id: data.categoryId } });
    if (category.type !== data.type) throw new Error("The category type does not match the entry type.");
    const entry = await tx.transaction.create({ data: { reference: makeReference(data.type === "INCOME" ? "INC" : "EXP"), type: data.type, transactionDate: new Date(data.transactionDate), amount: data.amount, currencyId: data.currencyId, categoryId: data.categoryId, description: data.description, notes: data.notes, allocations: { create: data.allocations } }, include: { allocations: true } });
    await tx.auditLog.create({ data: { recordType: "Transaction", recordId: entry.id, action: "CREATE", afterData: entry as unknown as Prisma.InputJsonValue, changedBy: actor() } });
    return entry;
  });
}

export async function createTransfer(raw: unknown) {
  const data = transferSchema.parse(raw);
  return db.$transaction(async (tx) => {
    const [source, destination] = await Promise.all([tx.account.findUniqueOrThrow({ where: { id: data.sourceAccountId } }), tx.account.findUniqueOrThrow({ where: { id: data.destinationAccountId } })]);
    if (source.status !== "ACTIVE" || destination.status !== "ACTIVE") throw new Error("Both accounts must be active.");
    if (source.currencyId !== destination.currencyId) throw new Error("A transfer must stay within one currency. Use Exchange instead.");
    const entry = await tx.transaction.create({ data: { reference: makeReference("TRF"), type: "TRANSFER", transactionDate: new Date(data.transactionDate), amount: data.amount, currencyId: source.currencyId, description: data.description, notes: data.notes, transfer: { create: { sourceAccountId: source.id, destinationAccountId: destination.id, amount: data.amount } } }, include: { transfer: true } });
    await tx.auditLog.create({ data: { recordType: "Transaction", recordId: entry.id, action: "CREATE", afterData: entry as unknown as Prisma.InputJsonValue, changedBy: actor() } });
    return entry;
  });
}

export async function createExchange(raw: unknown) {
  const data = exchangeSchema.parse(raw);
  return db.$transaction(async (tx) => {
    const [source, destination] = await Promise.all([tx.account.findUniqueOrThrow({ where: { id: data.sourceAccountId } }), tx.account.findUniqueOrThrow({ where: { id: data.destinationAccountId } })]);
    if (source.currencyId === destination.currencyId) throw new Error("Exchange accounts must use different currencies.");
    const calculated = data.sourceAmount * data.exchangeRate;
    const entry = await tx.transaction.create({ data: { reference: makeReference("EXC"), type: "EXCHANGE", transactionDate: new Date(data.transactionDate), amount: data.sourceAmount, currencyId: source.currencyId, description: data.description, notes: data.notes, exchange: { create: { sourceAccountId: source.id, destinationAccountId: destination.id, sourceAmount: data.sourceAmount, exchangeRate: data.exchangeRate, calculatedDestinationAmount: calculated, actualDestinationAmount: data.actualDestinationAmount } } }, include: { exchange: true } });
    await tx.auditLog.create({ data: { recordType: "Transaction", recordId: entry.id, action: "CREATE", afterData: entry as unknown as Prisma.InputJsonValue, changedBy: actor() } });
    return entry;
  });
}

export async function voidTransaction(id: string) {
  return db.$transaction(async (tx) => {
    const before = await tx.transaction.findUniqueOrThrow({ where: { id } });
    if (before.status === "VOIDED") return before;
    const after = await tx.transaction.update({ where: { id }, data: { status: "VOIDED" } });
    await tx.auditLog.create({ data: { recordType: "Transaction", recordId: id, action: "VOID", beforeData: before as unknown as Prisma.InputJsonValue, afterData: after as unknown as Prisma.InputJsonValue, changedBy: actor() } });
    return after;
  });
}
