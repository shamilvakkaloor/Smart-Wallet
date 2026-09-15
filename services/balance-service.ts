import { db } from "@/lib/db";
import { asNumber } from "@/lib/format";
import { accountAvailableBalance, ownedBalance } from "@/services/calculation";

export async function getFinancialPosition() {
  const currencies = await db.currency.findMany({ where: { status: "ACTIVE" }, include: { accounts: { where: { status: "ACTIVE" }, include: { openingBalance: true } } } });
  const results = [];
  for (const currency of currencies) {
    const accountIds = currency.accounts.map((a) => a.id);
    const [allocations, transfers, exchanges, debts] = await Promise.all([
      db.transactionAllocation.findMany({ where: { accountId: { in: accountIds }, transaction: { status: "ACTIVE" } }, include: { transaction: true } }),
      db.transfer.findMany({ where: { transaction: { status: "ACTIVE" }, OR: [{ sourceAccountId: { in: accountIds } }, { destinationAccountId: { in: accountIds } }] } }),
      db.exchange.findMany({ where: { transaction: { status: "ACTIVE" }, OR: [{ sourceAccountId: { in: accountIds } }, { destinationAccountId: { in: accountIds } }] } }),
      db.debtTransaction.findMany({ where: { currencyId: currency.id, status: "ACTIVE" } }),
    ]);
    const accountRows = currency.accounts.map((account) => {
      const input = {
        opening: asNumber(account.openingBalance?.amount),
        income: allocations.filter((x) => x.accountId === account.id && x.transaction.type === "INCOME").reduce((s, x) => s + asNumber(x.amount), 0),
        expense: allocations.filter((x) => x.accountId === account.id && x.transaction.type === "EXPENSE").reduce((s, x) => s + asNumber(x.amount), 0),
        transferIn: transfers.filter((x) => x.destinationAccountId === account.id).reduce((s, x) => s + asNumber(x.amount), 0),
        transferOut: transfers.filter((x) => x.sourceAccountId === account.id).reduce((s, x) => s + asNumber(x.amount), 0),
        exchangeIn: exchanges.filter((x) => x.destinationAccountId === account.id).reduce((s, x) => s + asNumber(x.actualDestinationAmount), 0),
        exchangeOut: exchanges.filter((x) => x.sourceAccountId === account.id).reduce((s, x) => s + asNumber(x.sourceAmount), 0),
        moneyGiven: debts.filter((x) => x.accountId === account.id && x.action === "MONEY_GIVEN").reduce((s, x) => s + asNumber(x.amount), 0),
        receivedBack: debts.filter((x) => x.accountId === account.id && x.action === "MONEY_RECEIVED_BACK").reduce((s, x) => s + asNumber(x.amount), 0),
        borrowed: debts.filter((x) => x.accountId === account.id && x.action === "MONEY_BORROWED").reduce((s, x) => s + asNumber(x.amount), 0),
        paidBack: debts.filter((x) => x.accountId === account.id && x.action === "MONEY_PAID_BACK").reduce((s, x) => s + asNumber(x.amount), 0),
      };
      return { id: account.id, name: account.accountName, type: account.type, available: accountAvailableBalance(input) };
    });
    const receivable = debts.filter((x) => x.action === "MONEY_GIVEN").reduce((s, x) => s + asNumber(x.amount), 0) - debts.filter((x) => x.action === "MONEY_RECEIVED_BACK").reduce((s, x) => s + asNumber(x.amount), 0);
    const payable = debts.filter((x) => x.action === "MONEY_BORROWED").reduce((s, x) => s + asNumber(x.amount), 0) - debts.filter((x) => x.action === "MONEY_PAID_BACK").reduce((s, x) => s + asNumber(x.amount), 0);
    const available = accountRows.reduce((s, a) => s + a.available, 0);
    results.push({ id: currency.id, code: currency.code, symbol: currency.symbol, decimals: currency.decimalPlaces, available, balance: ownedBalance(available, receivable, payable), receivable, payable, accounts: accountRows });
  }
  return results;
}
