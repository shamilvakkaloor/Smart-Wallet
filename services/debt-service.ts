import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { makeReference } from "@/lib/reference";
import { debtEntrySchema } from "@/validation/finance";

export async function createDebtEntry(raw: unknown) {
  const data = debtEntrySchema.parse(raw);
  return db.$transaction(async (tx) => {
    const account = await tx.account.findUniqueOrThrow({ where: { id: data.accountId } });
    if (account.currencyId !== data.currencyId) throw new Error("The account and debt currency must match.");
    if (data.action === "MONEY_RECEIVED_BACK" || data.action === "MONEY_PAID_BACK") {
      const directionIn = data.action === "MONEY_RECEIVED_BACK" ? "MONEY_GIVEN" : "MONEY_BORROWED";
      const prior = await tx.debtTransaction.findMany({ where: { personId: data.personId, currencyId: data.currencyId, status: "ACTIVE" } });
      const opened = prior.filter((x) => x.action === directionIn).reduce((s, x) => s + Number(x.amount), 0);
      const closed = prior.filter((x) => x.action === data.action).reduce((s, x) => s + Number(x.amount), 0);
      if (data.amount > opened - closed && !data.confirmOverpayment) throw new Error("OVERPAYMENT_CONFIRMATION_REQUIRED");
    }
    const entry = await tx.debtTransaction.create({ data: { reference: makeReference("DEB"), personId: data.personId, categoryId: data.categoryId, action: data.action, currencyId: data.currencyId, accountId: data.accountId, amount: data.amount, transactionDate: new Date(data.transactionDate), dueDate: data.dueDate ? new Date(data.dueDate) : null, description: data.description, notes: data.notes } });
    await tx.auditLog.create({ data: { recordType: "DebtTransaction", recordId: entry.id, action: "CREATE", afterData: entry as unknown as Prisma.InputJsonValue, changedBy: process.env.LOGIN_USER ?? "system" } });
    return entry;
  });
}
