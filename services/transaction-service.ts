import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { makeReference } from "@/lib/reference";
import { exchangeSchema, normalEntrySchema, transferSchema } from "@/validation/finance";

const actor = () => process.env.LOGIN_USER ?? "system";
const history = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const relations = { allocations: true, transfer: true, exchange: true } as const;

function parseEntry(raw: unknown) {
  const { type } = z.object({ type: z.enum(["INCOME", "EXPENSE", "TRANSFER", "EXCHANGE"]) }).parse(raw);
  if (type === "TRANSFER") return { ...transferSchema.parse(raw), type };
  if (type === "EXCHANGE") return { ...exchangeSchema.parse(raw), type };
  return normalEntrySchema.parse(raw);
}
type EntryData = ReturnType<typeof parseEntry>;

async function validateEntry(tx: Prisma.TransactionClient, data: EntryData, previousCategoryId?: string | null) {
  if ("allocations" in data) {
    const accounts = await tx.account.findMany({ where: { id: { in: data.allocations.map((x) => x.accountId) }, status: "ACTIVE" } });
    if (accounts.length !== data.allocations.length || accounts.some((a) => a.currencyId !== data.currencyId)) throw new Error("Every account must be active and use the selected currency.");
    const category = await tx.category.findUniqueOrThrow({ where: { id: data.categoryId }, include: { parent: true } });
    if (category.type !== data.type) throw new Error("The category type does not match the entry type.");
    const retainingCategory = category.id === previousCategoryId;
    if (!retainingCategory && (category.status !== "ACTIVE" || (category.parent && category.parent.status !== "ACTIVE"))) throw new Error("Choose an active category.");
    if (category.parent && (category.parent.type !== data.type || category.parent.parentId)) throw new Error("This category has an invalid parent. Correct it in Settings.");
    if (data.parentCategoryId && data.parentCategoryId !== (category.parentId ?? category.id)) throw new Error("Choose a subcategory belonging to the selected category.");
    return data.currencyId;
  }
  const [source, destination] = await Promise.all([
    tx.account.findUniqueOrThrow({ where: { id: data.sourceAccountId } }),
    tx.account.findUniqueOrThrow({ where: { id: data.destinationAccountId } }),
  ]);
  if (source.status !== "ACTIVE" || destination.status !== "ACTIVE") throw new Error("Both accounts must be active.");
  if (data.type === "TRANSFER" && source.currencyId !== destination.currencyId) throw new Error("A transfer must stay within one currency. Use Exchange instead.");
  if (data.type === "EXCHANGE" && source.currencyId === destination.currencyId) throw new Error("Exchange accounts must use different currencies.");
  return source.currencyId;
}

function entryValues(data: EntryData, currencyId: string) {
  return {
    type: data.type, transactionDate: new Date(data.transactionDate),
    amount: data.type === "EXCHANGE" ? data.sourceAmount : data.amount,
    currencyId, categoryId: "categoryId" in data ? data.categoryId : null,
    description: data.description, notes: data.notes,
  };
}

async function createLines(tx: Prisma.TransactionClient, id: string, data: EntryData) {
  if ("allocations" in data) {
    await tx.transactionAllocation.createMany({ data: data.allocations.map((line) => ({ ...line, transactionId: id })) });
  } else if (data.type === "TRANSFER") {
    await tx.transfer.create({ data: { transactionId: id, sourceAccountId: data.sourceAccountId, destinationAccountId: data.destinationAccountId, amount: data.amount } });
  } else {
    const calculated = new Prisma.Decimal(data.sourceAmount).times(data.exchangeRate).toDecimalPlaces(4);
    if (calculated.greaterThanOrEqualTo("1000000000000000")) throw new Error("Calculated exchange amount is too large.");
    await tx.exchange.create({ data: { transactionId: id, sourceAccountId: data.sourceAccountId, destinationAccountId: data.destinationAccountId, sourceAmount: data.sourceAmount, exchangeRate: data.exchangeRate, calculatedDestinationAmount: calculated, actualDestinationAmount: data.actualDestinationAmount } });
  }
}

async function createEntry(raw: unknown) {
  const data = parseEntry(raw);
  return db.$transaction(async (tx) => {
    const currencyId = await validateEntry(tx, data);
    const prefix = { INCOME: "INC", EXPENSE: "EXP", TRANSFER: "TRF", EXCHANGE: "EXC" }[data.type];
    const entry = await tx.transaction.create({ data: { ...entryValues(data, currencyId), reference: makeReference(prefix) } });
    await createLines(tx, entry.id, data);
    const after = await tx.transaction.findUniqueOrThrow({ where: { id: entry.id }, include: relations });
    await tx.auditLog.create({ data: { recordType: "Transaction", recordId: entry.id, action: "CREATE", afterData: history(after), changedBy: actor() } });
    return after;
  });
}

export const createNormalEntry = createEntry;
export const createTransfer = createEntry;
export const createExchange = createEntry;

export async function updateEntry(id: string, raw: unknown) {
  const data = parseEntry(raw);
  const { updatedAt } = z.object({ updatedAt: z.string().datetime() }).parse(raw);
  return db.$transaction(async (tx) => {
    const before = await tx.transaction.findUniqueOrThrow({ where: { id }, include: relations });
    if (before.status !== "ACTIVE") throw new Error("Deleted entries cannot be edited.");
    if (before.type !== data.type) throw new Error("The entry type cannot be changed. Delete this entry and create a new one instead.");
    const currencyId = await validateEntry(tx, data, before.categoryId);
    const nextVersion = new Date(Math.max(Date.now(), before.updatedAt.getTime() + 1));
    // Claim the expected version before replacing lines; a concurrent edit/delete cannot be overwritten.
    const claimed = await tx.transaction.updateMany({ where: { id, status: "ACTIVE", updatedAt: new Date(updatedAt) }, data: { updatedAt: nextVersion } });
    if (claimed.count !== 1) throw new Error("This entry changed while you were editing. Reload it before saving.");
    await tx.transactionAllocation.deleteMany({ where: { transactionId: id } });
    await tx.transfer.deleteMany({ where: { transactionId: id } });
    await tx.exchange.deleteMany({ where: { transactionId: id } });
    await tx.transaction.update({ where: { id }, data: { ...entryValues(data, currencyId), updatedAt: nextVersion } });
    await createLines(tx, id, data);
    const after = await tx.transaction.findUniqueOrThrow({ where: { id }, include: relations });
    await tx.auditLog.create({ data: { recordType: "Transaction", recordId: id, action: "UPDATE", beforeData: history(before), afterData: history(after), changedBy: actor() } });
    return after;
  });
}

export async function voidTransaction(id: string) {
  return db.$transaction(async (tx) => {
    const before = await tx.transaction.findUniqueOrThrow({ where: { id }, include: relations });
    if (before.status === "VOIDED") return before;
    const changed = await tx.transaction.updateMany({ where: { id, status: "ACTIVE", updatedAt: before.updatedAt }, data: { status: "VOIDED" } });
    if (changed.count !== 1) throw new Error("This entry changed. Refresh it before deleting.");
    const after = await tx.transaction.findUniqueOrThrow({ where: { id }, include: relations });
    await tx.auditLog.create({ data: { recordType: "Transaction", recordId: id, action: "VOID", beforeData: history(before), afterData: history(after), changedBy: actor() } });
    return after;
  });
}
