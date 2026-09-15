import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { walletAuthAdapter } from "../lib/auth-adapter";

function setup() {
  const authAccount = {
    findUnique: vi.fn(), create: vi.fn(), delete: vi.fn(), findFirst: vi.fn(),
  };
  const db = {
    authAccount,
    get account() { throw new Error("OAuth must never access financial wallets"); },
  } as unknown as PrismaClient;
  return { authAccount, adapter: walletAuthAdapter(db) };
}

describe("OAuth account model mapping", () => {
  it("finds an existing Google user through the OAuth identity", async () => {
    const { authAccount, adapter } = setup();
    const user = { id: "user-1", email: "owner@example.com", emailVerified: null };
    authAccount.findUnique.mockResolvedValue({ user });
    const identity = { provider: "google", providerAccountId: "google-1" };
    expect(await adapter.getUserByAccount!(identity)).toEqual(user);
    expect(authAccount.findUnique).toHaveBeenCalledWith({
      where: { provider_providerAccountId: identity }, include: { user: true },
    });
  });

  it("returns null for a Google identity that is not linked yet", async () => {
    const { authAccount, adapter } = setup();
    authAccount.findUnique.mockResolvedValue(null);
    expect(await adapter.getUserByAccount!({ provider: "google", providerAccountId: "new" })).toBeNull();
  });

  it("links, reads and unlinks OAuth accounts without touching wallets", async () => {
    const { authAccount, adapter } = setup();
    const account = { userId: "user-1", provider: "google", providerAccountId: "google-1", type: "oidc" as const };
    await adapter.linkAccount!(account);
    expect(authAccount.create).toHaveBeenCalledWith({ data: account });
    authAccount.findFirst.mockResolvedValue(account);
    expect(await adapter.getAccount!("google-1", "google")).toEqual(account);
    expect(authAccount.findFirst).toHaveBeenCalledWith({ where: { providerAccountId: "google-1", provider: "google" } });
    const identity = { provider: "google", providerAccountId: "google-1" };
    await adapter.unlinkAccount!(identity);
    expect(authAccount.delete).toHaveBeenCalledWith({ where: { provider_providerAccountId: identity } });
  });
});
