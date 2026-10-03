import { z } from "zod";
const optionalText = z.string().max(200).default("");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => { const d=new Date(s); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10)===s; }, "Choose a valid date.");
const optionalAmount = z.preprocess(v => v === "" || v === undefined ? undefined : v, z.coerce.number().finite().nonnegative().max(999999999999).optional());
export function parseReportFilters(raw: Record<string, unknown>, now = new Date()) {
  return z.object({
    view: z.enum(["monthly","yearly","custom","all"]).default("monthly"),
    year: z.coerce.number().int().min(1900).max(9998).default(now.getFullYear()),
    month: z.coerce.number().int().min(1).max(12).default(now.getMonth()+1),
    from: z.union([date,z.literal("")]).default(""), to: z.union([date,z.literal("")]).default(""),
    currencyId: optionalText, accountId: optionalText, accountType: z.enum(["","CASH","BANK"]).default(""),
    type: z.enum(["","INCOME","EXPENSE"]).default(""), categoryId: optionalText, subcategoryId: optionalText,
    grouping: z.enum(["category","subcategory"]).default("category"), q: z.string().trim().max(200).default(""),
    min: optionalAmount, max: optionalAmount, showZero: z.enum(["","1"]).default(""), page: z.coerce.number().int().min(1).max(1000000).default(1),
  }).superRefine((f,ctx) => {
    if (f.view === "custom" && (!f.from || !f.to || f.from>f.to)) ctx.addIssue({code:"custom",message:"Choose a valid start and end date in order."});
    if (f.min !== undefined && f.max !== undefined && f.min>f.max) ctx.addIssue({code:"custom",message:"Minimum amount cannot exceed maximum amount."});
    if (f.subcategoryId && !f.categoryId) ctx.addIssue({code:"custom",message:"Choose a parent category before a subcategory."});
  }).parse(raw);
}
export type ReportFilters = ReturnType<typeof parseReportFilters>;
export function reportRange(f: ReportFilters): { gte?: Date; lt?: Date } {
  if (f.view === "all") return {};
  if (f.view === "custom") { const end=new Date(f.to);end.setUTCDate(end.getUTCDate()+1);return {gte:new Date(f.from),lt:end}; }
  return f.view === "yearly" ? {gte:new Date(Date.UTC(f.year,0,1)),lt:new Date(Date.UTC(f.year+1,0,1))} : {gte:new Date(Date.UTC(f.year,f.month-1,1)),lt:new Date(Date.UTC(f.year,f.month,1))};
}
export function reportQuery(f: ReportFilters, changes: Record<string,string | number> = {}) {
  const params=new URLSearchParams();
  for(const [key,value] of Object.entries({...f,...changes})) if(value !== undefined && value !== "")params.set(key,String(value));
  return params.toString();
}
