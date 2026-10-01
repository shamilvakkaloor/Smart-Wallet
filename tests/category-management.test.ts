import { beforeEach, expect, it, vi } from "vitest";
const { tx } = vi.hoisted(() => ({ tx: { category: { findUniqueOrThrow: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() }, debtCategory: { findUniqueOrThrow: vi.fn(), update: vi.fn(), delete: vi.fn() }, auditLog: { create: vi.fn() } } }));
vi.mock("@/lib/db", () => ({ db: { $transaction: (fn: (client: typeof tx) => unknown) => fn(tx) } }));
import { createCategory, deleteCategory, renameCategory } from "../services/category-service";
const category = { id: "food", name: "Food", type: "EXPENSE", status: "ACTIVE", parentId: null, children: [], _count: { transactions: 1, budgets: 0 } };
beforeEach(() => { vi.resetAllMocks(); tx.category.findUniqueOrThrow.mockResolvedValue(category); tx.category.update.mockResolvedValue(category); });
it("renames without changing category identity or relationships", async () => {
  await renameCategory("normal", "food", { name: "Dining", parentId: "other", type: "INCOME" });
  expect(tx.category.update).toHaveBeenCalledWith({ where: { id: "food" }, data: { name: "Dining" } });
  expect(tx.auditLog.create.mock.calls[0][0].data.action).toBe("UPDATE");
});
it("archives used categories", async () => {
  expect(await deleteCategory("normal", "food")).toEqual({ archived: true });
  expect(tx.category.delete).not.toHaveBeenCalled();
  expect(tx.category.update.mock.calls[0][0].data).toEqual({ status: "INACTIVE" });
});
it("removes unused categories", async () => {
  tx.category.findUniqueOrThrow.mockResolvedValue({ ...category, _count: { transactions: 0, budgets: 0 } });
  expect(await deleteCategory("normal", "food")).toEqual({ archived: false }); expect(tx.category.delete).toHaveBeenCalled();
});
it("requires children to be deleted first", async () => {
  tx.category.findUniqueOrThrow.mockResolvedValue({ ...category, children: [{ status: "ACTIVE" }] });
  await expect(deleteCategory("normal", "food")).rejects.toThrow("subcategories first");
  expect(tx.category.update).not.toHaveBeenCalled();
});
it("archives debt categories in use", async () => {
  tx.debtCategory.findUniqueOrThrow.mockResolvedValue({ id: "loan", _count: { debtTransactions: 1 } });
  expect(await deleteCategory("debt", "loan")).toEqual({ archived: true }); expect(tx.debtCategory.delete).not.toHaveBeenCalled();
});
it("rejects a parent of a different type", async () => {
  await expect(createCategory("normal", { name: "Tips", type: "INCOME", parentId: "food" })).rejects.toThrow("same type");
});
it("rejects third-level categories", async () => {
  tx.category.findUniqueOrThrow.mockResolvedValue({ ...category, parentId: "grandparent" });
  await expect(createCategory("normal", { name: "Snacks", type: "EXPENSE", parentId: "food" })).rejects.toThrow("Subcategories cannot");
});
