import { z } from "zod";

const amount = z.coerce.number().positive().finite();
const dateString = z.string().min(10);

export const normalEntrySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  transactionDate: dateString,
  amount,
  currencyId: z.string().min(1),
  categoryId: z.string().min(1),
  description: z.string().trim().min(1).max(200),
  notes: z.string().max(5000).optional().default(""),
  allocations: z.array(z.object({ accountId: z.string().min(1), amount })).min(1),
  confirmNegative: z.boolean().optional().default(false),
}).superRefine((data, ctx) => {
  const allocated = data.allocations.reduce((sum, line) => sum + line.amount, 0);
  if (Math.abs(allocated - data.amount) > 0.0001) ctx.addIssue({ code: "custom", path: ["allocations"], message: "Allocations must equal the transaction amount." });
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
  exchangeRate: amount,
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
