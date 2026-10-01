import { z } from "zod";
import { Prisma } from "@prisma/client";

const amount = z.coerce.number().positive().finite().max(999999999999, "Amount is too large.").refine((v) => new Prisma.Decimal(v).decimalPlaces() <= 4, "Amounts support up to four decimal places.");
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.").refine((v) => {
  const date = new Date(v);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === v;
}, "Enter a valid date.");

export const normalEntrySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  transactionDate: dateString,
  amount,
  currencyId: z.string().min(1),
  categoryId: z.string().min(1),
  parentCategoryId: z.string().min(1).optional(),
  description: z.string().trim().min(1).max(200),
  notes: z.string().max(5000).optional().default(""),
  allocations: z.array(z.object({ accountId: z.string().min(1), amount })).min(1),
  confirmNegative: z.boolean().optional().default(false),
}).superRefine((data, ctx) => {
  const allocated = data.allocations.reduce((sum, line) => sum.plus(line.amount), new Prisma.Decimal(0));
  if (!allocated.equals(data.amount)) ctx.addIssue({ code: "custom", path: ["allocations"], message: "The account split amounts must add up to the total amount." });
  if (new Set(data.allocations.map((line) => line.accountId)).size !== data.allocations.length) ctx.addIssue({ code: "custom", path: ["allocations"], message: "Choose each account only once." });
});

export const transferSchema = z.object({
  transactionDate: dateString,
  sourceAccountId: z.string().min(1),
  destinationAccountId: z.string().min(1),
  amount,
  description: z.string().trim().min(1).max(200),
  notes: z.string().max(5000).optional().default(""),
  confirmNegative: z.boolean().optional().default(false),
}).refine((v) => v.sourceAccountId !== v.destinationAccountId, "Source and destination must differ.");

export const exchangeSchema = z.object({
  transactionDate: dateString,
  sourceAccountId: z.string().min(1),
  destinationAccountId: z.string().min(1),
  sourceAmount: amount,
  exchangeRate: z.coerce.number().positive().finite().max(999999999999).refine((v) => new Prisma.Decimal(v).decimalPlaces() <= 8, "Exchange rates support up to eight decimal places."),
  actualDestinationAmount: amount,
  description: z.string().trim().min(1).max(200),
  notes: z.string().max(5000).optional().default(""),
  confirmNegative: z.boolean().optional().default(false),
});

export const debtEntrySchema = z.object({
  personId: z.string().min(1), categoryId: z.string().min(1),
  action: z.enum(["MONEY_GIVEN", "MONEY_RECEIVED_BACK", "MONEY_BORROWED", "MONEY_PAID_BACK"]),
  currencyId: z.string().min(1), accountId: z.string().min(1), amount,
  transactionDate: dateString, dueDate: z.string().optional(),
  description: z.string().trim().min(1).max(200), notes: z.string().max(5000).optional().default(""),
  confirmOverpayment: z.boolean().optional().default(false),
});
