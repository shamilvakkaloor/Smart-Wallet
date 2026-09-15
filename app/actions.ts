"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { voidTransaction } from "@/services/transaction-service";

export async function login() { await signIn("google", { redirectTo: "/" }); }
export async function logout() { await signOut({ redirectTo: "/login" }); }

export async function addAccount(form: FormData) {
  const currencyId = String(form.get("currencyId"));
  const accountName = String(form.get("accountName") ?? "").trim();
  const bankName = String(form.get("bankName") ?? "").trim() || null;
  if (!currencyId || !accountName) throw new Error("Currency and account name are required.");
  await db.account.create({ data: { currencyId, accountName, bankName, type: "BANK", openingBalance: { create: { amount: Number(form.get("openingAmount") ?? 0), openingDate: new Date(String(form.get("openingDate"))) } } } });
  revalidatePath("/wallets");
}

export async function addCurrency(form: FormData) {
  const code = String(form.get("code") ?? "").trim().toUpperCase();
  const name = String(form.get("name") ?? "").trim();
  const symbol = String(form.get("symbol") ?? "").trim();
  const decimalPlaces = Number(form.get("decimalPlaces") ?? 2);
  if (!/^[A-Z]{3}$/.test(code) || !name || !symbol) throw new Error("Enter a valid three-letter currency, name, and symbol.");
  await db.$transaction(async (tx) => {
    const currency = await tx.currency.create({ data: { code, name, symbol, decimalPlaces } });
    await tx.account.create({ data: { type: "CASH", currencyId: currency.id, accountName: `${code} Cash`, openingBalance: { create: { amount: 0, openingDate: new Date() } } } });
  });
  revalidatePath("/settings"); revalidatePath("/wallets");
}

export async function addCategory(form: FormData) {
  await db.category.create({ data: { name: String(form.get("name") ?? "").trim(), type: String(form.get("type")) as "INCOME" | "EXPENSE", parentId: String(form.get("parentId") ?? "") || null } });
  revalidatePath("/settings");
}

export async function addPerson(form: FormData) {
  await db.person.create({ data: { name: String(form.get("name") ?? "").trim(), contact: String(form.get("contact") ?? "").trim() || null } });
  revalidatePath("/debt"); revalidatePath("/settings");
}

export async function addDebtCategory(form: FormData) {
  await db.debtCategory.create({ data: { name: String(form.get("name") ?? "").trim() } });
  revalidatePath("/settings");
}

export async function addExchangeRate(form: FormData) {
  await db.exchangeRate.upsert({
    where: { baseCurrencyId_quoteCurrencyId_rateDate: { baseCurrencyId: String(form.get("baseCurrencyId")), quoteCurrencyId: String(form.get("quoteCurrencyId")), rateDate: new Date(String(form.get("rateDate"))) } },
    create: { baseCurrencyId: String(form.get("baseCurrencyId")), quoteCurrencyId: String(form.get("quoteCurrencyId")), rate: Number(form.get("rate")), rateDate: new Date(String(form.get("rateDate"))) },
    update: { rate: Number(form.get("rate")) },
  });
  revalidatePath("/settings");
}

export async function addBudget(form: FormData) {
  await db.budget.create({ data: { categoryId: String(form.get("categoryId")), currencyMode: String(form.get("currencyMode")) as "OMR" | "INR" | "COMBINED", amount: Number(form.get("amount")), isDefault: form.get("isDefault") === "on", effectiveMonth: form.get("effectiveMonth") ? new Date(String(form.get("effectiveMonth")) + "-01") : null } });
  revalidatePath("/budgets");
}

export async function voidEntry(form: FormData) {
  await voidTransaction(String(form.get("id")));
  revalidatePath("/entries"); revalidatePath("/");
}

export async function goToNewEntry(form: FormData) {
  redirect(`/entries/new?type=${String(form.get("type") ?? "EXPENSE")}`);
}
