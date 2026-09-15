import { describe, expect, it } from "vitest";
import { accountAvailableBalance, ownedBalance, outstanding } from "../services/calculation";

describe("financial calculation engine", () => {
  it("calculates the money currently available in an account", () => {
    expect(accountAvailableBalance({ opening: 100, income: 80, expense: 20, transferIn: 10, transferOut: 5, exchangeIn: 0, exchangeOut: 0, moneyGiven: 30, receivedBack: 10, borrowed: 25, paidBack: 5 })).toBe(165);
  });
  it("separates owned balance from available balance", () => {
    expect(ownedBalance(400, 200, 100)).toBe(500);
  });
  it("never reports a negative outstanding amount", () => {
    expect(outstanding(100, 120)).toBe(0);
  });
});
