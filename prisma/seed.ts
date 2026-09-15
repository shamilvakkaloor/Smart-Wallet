import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const omr = await db.currency.upsert({ where: { code: "OMR" }, update: {}, create: { code: "OMR", name: "Omani Rial", symbol: "ر.ع.", decimalPlaces: 3 } });
  const inr = await db.currency.upsert({ where: { code: "INR" }, update: {}, create: { code: "INR", name: "Indian Rupee", symbol: "₹", decimalPlaces: 2 } });
  for (const currency of [omr, inr]) {
    const exists = await db.account.findFirst({ where: { currencyId: currency.id, type: "CASH" } });
    if (!exists) await db.account.create({ data: { type: "CASH", currencyId: currency.id, accountName: `${currency.code} Cash`, openingBalance: { create: { amount: 0, openingDate: new Date() } } } });
  }
  const expense = ["Food & Dining", "Housing", "Transport", "Shopping", "Health", "Education", "Utilities", "Travel", "Other Expense"];
  const income = ["Salary", "Business", "Freelance", "Investment", "Gift", "Other Income"];
  for (const [type, names] of [["EXPENSE", expense], ["INCOME", income]] as const) {
    for (let i = 0; i < names.length; i++) {
      const existing = await db.category.findFirst({ where: { type, parentId: null, name: names[i] } });
      if (existing) await db.category.update({ where: { id: existing.id }, data: { sortOrder: i } });
      else await db.category.create({ data: { type, name: names[i], sortOrder: i } });
    }
  }
  for (const [i, name] of ["Personal Loan", "Paid on Behalf", "Borrowed Money", "Shared Expense", "Other"].entries()) await db.debtCategory.upsert({ where: { name }, update: { sortOrder: i }, create: { name, sortOrder: i } });
  await db.appSetting.upsert({ where: { key: "currencyDisplay" }, update: {}, create: { key: "currencyDisplay", value: "CODE_SYMBOL" } });
  console.log("Smart Wallet seed completed.");
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
