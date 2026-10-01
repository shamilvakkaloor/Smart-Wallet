import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";

const nameSchema = z.string().trim().min(1, "Enter a category name.").max(100, "Use 100 characters or fewer.");
const createSchema = z.object({ name: nameSchema, type: z.enum(["INCOME", "EXPENSE"]), parentId: z.string().min(1).nullable().default(null) });
const snapshot = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

async function audit(tx: Prisma.TransactionClient, kind: "normal" | "debt", id: string, action: "CREATE" | "UPDATE" | "VOID", before: unknown, after: unknown) {
  await tx.auditLog.create({ data: { recordType: kind === "normal" ? "Category" : "DebtCategory", recordId: id, action, beforeData: before ? snapshot(before) : Prisma.JsonNull, afterData: snapshot(after), changedBy: process.env.LOGIN_USER ?? "system" } });
}

export async function createCategory(kind: "normal" | "debt", raw: unknown) {
  return db.$transaction(async (tx) => {
    if (kind === "debt") {
      const { name } = z.object({ name: nameSchema }).parse(raw);
      const after = await tx.debtCategory.create({ data: { name } });
      await audit(tx, kind, after.id, "CREATE", null, after);
      return after;
    }
    const data = createSchema.parse(raw);
    if (data.parentId) {
      const parent = await tx.category.findUniqueOrThrow({ where: { id: data.parentId } });
      if (parent.status !== "ACTIVE" || parent.parentId || parent.type !== data.type) throw new Error("Choose an active parent category of the same type. Subcategories cannot contain more subcategories.");
    }
    if (await tx.category.findFirst({ where: { type: data.type, parentId: data.parentId, name: data.name } })) throw new Error("That category name already exists under this parent, including deleted categories.");
    const after = await tx.category.create({ data });
    await audit(tx, kind, after.id, "CREATE", null, after);
    return after;
  });
}

export async function renameCategory(kind: "normal" | "debt", id: string, raw: unknown) {
  const { name } = z.object({ name: nameSchema }).parse(raw);
  return db.$transaction(async (tx) => {
    if (kind === "debt") {
      const before = await tx.debtCategory.findUniqueOrThrow({ where: { id } });
      if (before.status !== "ACTIVE") throw new Error("This category has been deleted. Refresh the page.");
      const after = await tx.debtCategory.update({ where: { id }, data: { name } });
      await audit(tx, kind, id, "UPDATE", before, after);
      return after;
    }
    const before = await tx.category.findUniqueOrThrow({ where: { id } });
    if (before.status !== "ACTIVE") throw new Error("This category has been deleted. Refresh the page.");
    if (await tx.category.findFirst({ where: { id: { not: id }, type: before.type, parentId: before.parentId, name } })) throw new Error("That category name already exists under this parent, including deleted categories.");
    const after = await tx.category.update({ where: { id }, data: { name } });
    await audit(tx, kind, id, "UPDATE", before, after);
    return after;
  });
}

export async function deleteCategory(kind: "normal" | "debt", id: string) {
  return db.$transaction(async (tx) => {
    if (kind === "debt") {
      const before = await tx.debtCategory.findUniqueOrThrow({ where: { id }, include: { _count: { select: { debtTransactions: true } } } });
      const archived = before._count.debtTransactions > 0;
      if (archived) await tx.debtCategory.update({ where: { id }, data: { status: "INACTIVE" } });
      else await tx.debtCategory.delete({ where: { id } });
      await audit(tx, kind, id, "VOID", before, { deleted: true, historyRetained: archived });
      return { archived };
    }
    const before = await tx.category.findUniqueOrThrow({ where: { id }, include: { children: { select: { status: true } }, _count: { select: { transactions: true, budgets: true } } } });
    if (before.children.some((child) => child.status === "ACTIVE")) throw new Error("Delete the subcategories first, then delete their parent category.");
    const archived = before._count.transactions > 0 || before._count.budgets > 0 || before.children.length > 0;
    if (archived) await tx.category.update({ where: { id }, data: { status: "INACTIVE" } });
    else await tx.category.delete({ where: { id } });
    await audit(tx, kind, id, "VOID", before, { deleted: true, historyRetained: archived });
    return { archived };
  });
}
