import { beforeEach, describe, expect, it, vi } from "vitest";
const { tx } = vi.hoisted(() => ({ tx: {
  transaction: { findUniqueOrThrow: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
  account: { findMany: vi.fn(), findUniqueOrThrow: vi.fn() }, category: { findUniqueOrThrow: vi.fn() },
  transactionAllocation: { deleteMany: vi.fn(), createMany: vi.fn() }, transfer: { deleteMany: vi.fn(), create: vi.fn() }, exchange: { deleteMany: vi.fn(), create: vi.fn() }, auditLog: { create: vi.fn() },
} }));
vi.mock("@/lib/db", () => ({ db: { $transaction: (fn: (client: typeof tx) => unknown) => fn(tx) } }));
import { updateEntry, voidTransaction } from "../services/transaction-service";
import { normalEntrySchema } from "../validation/finance";
const common = { transactionDate: "2026-10-01", description: "Groceries", updatedAt: "2026-10-01T00:00:00.000Z" };
const normal = { ...common, type: "EXPENSE", currencyId: "omr", categoryId: "cat", parentCategoryId: "cat", amount: 20, allocations: [{ accountId: "cash", amount: 12 }, { accountId: "bank", amount: 8 }] };
function before(type = "EXPENSE") { return { id: "entry", reference: "EXP-original", type, status: "ACTIVE", categoryId: "cat", updatedAt: new Date(common.updatedAt), allocations: [{ accountId: "cash", amount: 10 }], transfer: null, exchange: null }; }
beforeEach(() => {
  vi.resetAllMocks();
  tx.transaction.findUniqueOrThrow.mockResolvedValue(before()); tx.transaction.updateMany.mockResolvedValue({ count: 1 });
  tx.account.findMany.mockResolvedValue([{ id: "cash", currencyId: "omr" }, { id: "bank", currencyId: "omr" }]);
  tx.category.findUniqueOrThrow.mockResolvedValue({ id: "cat", type: "EXPENSE", status: "ACTIVE", parentId: null, parent: null });
  tx.account.findUniqueOrThrow.mockImplementation(async ({ where }) => ({ id: where.id, currencyId: where.id === "foreign" ? "inr" : "omr", status: "ACTIVE" }));
});
describe("entry edits and deletion", () => {
  it.each(["EXPENSE", "INCOME", "TRANSFER", "EXCHANGE"])("replaces %s lines atomically under the original ID and records before/after", async type => {
    const original = before(type); const after = { ...original, description: "Updated" };
    tx.transaction.findUniqueOrThrow.mockResolvedValueOnce(original).mockResolvedValueOnce(after);
    tx.category.findUniqueOrThrow.mockResolvedValue({ id: "cat", type, status: "ACTIVE", parentId: null, parent: null });
    const data = type === "TRANSFER" ? { ...common, type, sourceAccountId: "cash", destinationAccountId: "bank", amount: 20 } : type === "EXCHANGE" ? { ...common, type, sourceAccountId: "cash", destinationAccountId: "foreign", sourceAmount: 20, exchangeRate: 200, actualDestinationAmount: 3999 } : { ...normal, type };
    await updateEntry("entry", data);
    expect(tx.transaction.update.mock.calls[0][0].where).toEqual({ id: "entry" });
    expect(tx.transaction.update.mock.calls[0][0].data.reference).toBeUndefined();
    expect(tx.transactionAllocation.deleteMany).toHaveBeenCalledWith({ where: { transactionId: "entry" } });
    if (type === "TRANSFER") expect(tx.transfer.create.mock.calls[0][0].data.amount).toBe(20);
    else if (type === "EXCHANGE") expect(String(tx.exchange.create.mock.calls[0][0].data.calculatedDestinationAmount)).toBe("4000");
    else expect(tx.transactionAllocation.createMany.mock.calls[0][0].data).toHaveLength(2);
    expect(tx.auditLog.create.mock.calls[0][0].data).toMatchObject({ action: "UPDATE", beforeData: { reference: "EXP-original", allocations: original.allocations }, afterData: { description: "Updated" } });
  });
  it("rejects stale edits before deleting any lines", async () => {
    tx.transaction.updateMany.mockResolvedValue({ count: 0 });
    await expect(updateEntry("entry", normal)).rejects.toThrow("Reload");
    expect(tx.transactionAllocation.deleteMany).not.toHaveBeenCalled(); expect(tx.auditLog.create).not.toHaveBeenCalled();
  });
  it("rejects editing a deleted entry", async () => {
    tx.transaction.findUniqueOrThrow.mockResolvedValue({ ...before(), status: "VOIDED" });
    await expect(updateEntry("entry", normal)).rejects.toThrow("Deleted");
  });
  it("rejects a subcategory from another selected parent", async () => {
    await expect(updateEntry("entry", { ...normal, parentCategoryId: "other" })).rejects.toThrow("belonging");
    expect(tx.transaction.updateMany).not.toHaveBeenCalled();
  });
  it("deletes by status while retaining lines and a full audit snapshot", async () => {
    await voidTransaction("entry");
    expect(tx.transaction.updateMany.mock.calls[0][0].data).toEqual({ status: "VOIDED" });
    expect(tx.transactionAllocation.deleteMany).not.toHaveBeenCalled();
    expect(tx.auditLog.create.mock.calls[0][0].data.action).toBe("VOID");
  });
  it("does not duplicate deletion audit records", async () => {
    tx.transaction.findUniqueOrThrow.mockResolvedValue({ ...before(), status: "VOIDED" });
    await voidTransaction("entry"); expect(tx.auditLog.create).not.toHaveBeenCalled();
  });
});
describe("allocation validation", () => {
  it("accepts exact decimal sums", () => expect(normalEntrySchema.parse({ ...normal, amount: 0.3, allocations: [{ accountId: "a", amount: 0.1 }, { accountId: "b", amount: 0.2 }] }).amount).toBe(0.3));
  it("rejects mismatched sums", () => expect(() => normalEntrySchema.parse({ ...normal, amount: 21 })).toThrow("add up"));
  it("rejects duplicate accounts", () => expect(() => normalEntrySchema.parse({ ...normal, allocations: [{ accountId: "a", amount: 10 }, { accountId: "a", amount: 10 }] })).toThrow("only once"));
  it("rejects impossible dates", () => expect(() => normalEntrySchema.parse({ ...normal, transactionDate: "2026-02-30" })).toThrow("valid date"));
});
