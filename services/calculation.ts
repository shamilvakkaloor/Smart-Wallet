export type AccountEffectInput = {
  opening: number;
  income: number;
  expense: number;
  transferIn: number;
  transferOut: number;
  exchangeIn: number;
  exchangeOut: number;
  moneyGiven: number;
  receivedBack: number;
  borrowed: number;
  paidBack: number;
};

export function accountAvailableBalance(v: AccountEffectInput) {
  return v.opening + v.income - v.expense + v.transferIn - v.transferOut + v.exchangeIn - v.exchangeOut - v.moneyGiven + v.receivedBack + v.borrowed - v.paidBack;
}

export function ownedBalance(available: number, receivable: number, payable: number) {
  return available + receivable - payable;
}

export function outstanding(received: number, settled: number) {
  return Math.max(0, received - settled);
}
