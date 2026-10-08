import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
const where = { status: "ACTIVE" as const, reference: { startsWith: "IMP-" } };
function version(rows: { id: string; updatedAt: Date }[]) {
 return createHash("sha256").update(JSON.stringify(rows.map(r => [r.id, r.updatedAt.toISOString()]).sort((a,b) => a[0].localeCompare(b[0])))).digest("hex");
}
export async function previewImportCleanup() {
 const rows = await db.transaction.findMany({ where, select: { id: true, updatedAt: true } });
 return { count: rows.length, version: version(rows) };
}
export async function voidAllExcelImports(raw: unknown) {
 const input = z.object({ version: z.string().regex(/^[a-f0-9]{64}$/), confirmation: z.literal("VOID ALL EXCEL IMPORTS") }).parse(raw);
 return db.$transaction(async tx => {
  const rows = await tx.transaction.findMany({ where, include: { allocations: true, transfer: true, exchange: true } });
  if (version(rows) !== input.version) throw new Error("Imported entries changed. Review the latest count and confirm again. Nothing was voided.");
  for (const before of rows) {
   const updatedAt = new Date(Math.max(Date.now(), before.updatedAt.getTime() + 1));
   const changed = await tx.transaction.updateMany({ where: { ...where, id: before.id, updatedAt: before.updatedAt }, data: { status: "VOIDED", updatedAt } });
   if (changed.count !== 1) throw new Error("An imported entry changed. Refresh and try again. Nothing was voided.");
   await tx.auditLog.create({ data: { recordType: "Transaction", recordId: before.id, action: "VOID", changedBy: process.env.LOGIN_USER ?? "system", beforeData: JSON.parse(JSON.stringify(before)), afterData: JSON.parse(JSON.stringify({ ...before, status: "VOIDED", updatedAt })) } });
  }
  return { voided: rows.length };
 }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60000 });
}
