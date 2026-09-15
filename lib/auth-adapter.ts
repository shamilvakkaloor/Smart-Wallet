import { PrismaAdapter } from "@auth/prisma-adapter";
import type { PrismaClient } from "@prisma/client";
import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";

// The wallet model uses `account`; OAuth identities use `authAccount`.
export function walletAuthAdapter(db: PrismaClient): Adapter {
  return {
    ...PrismaAdapter(db),
    async getUserByAccount(provider_providerAccountId) {
      const account = await db.authAccount.findUnique({
        where: { provider_providerAccountId },
        include: { user: true },
      });
      return (account?.user as AdapterUser | undefined) ?? null;
    },
    async linkAccount(account) {
      await db.authAccount.create({ data: account });
    },
    async unlinkAccount(provider_providerAccountId) {
      await db.authAccount.delete({ where: { provider_providerAccountId } });
    },
    async getAccount(providerAccountId, provider) {
      return await db.authAccount.findFirst({
        where: { providerAccountId, provider },
      }) as AdapterAccount | null;
    },
  };
}
