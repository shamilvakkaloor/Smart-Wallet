import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), updateEntry: vi.fn(), voidTransaction: vi.fn(), createCategory: vi.fn(), renameCategory: vi.fn(), deleteCategory: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/services/transaction-service", () => ({ updateEntry: mocks.updateEntry, voidTransaction: mocks.voidTransaction }));
vi.mock("@/services/category-service", () => ({ createCategory: mocks.createCategory, renameCategory: mocks.renameCategory, deleteCategory: mocks.deleteCategory }));
import { PATCH as editEntry, DELETE as deleteEntry } from "../app/api/entries/[id]/route";
import { POST, PATCH, DELETE } from "../app/api/categories/route";
const request = (body = {}) => new Request("http://localhost/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => { vi.resetAllMocks(); });
it("denies every management action without a logged-in user", async () => {
  const context = { params: Promise.resolve({ id: "entry" }) };
  for (const response of await Promise.all([editEntry(request(), context), deleteEntry(request(), context), POST(request()), PATCH(request()), DELETE(request())])) expect(response.status).toBe(401);
  for (const action of [mocks.updateEntry, mocks.voidTransaction, mocks.createCategory, mocks.renameCategory, mocks.deleteCategory]) expect(action).not.toHaveBeenCalled();
});
it("sends authenticated edits to the original entry ID", async () => {
  mocks.auth.mockResolvedValue({ user: { name: "test" } }); mocks.updateEntry.mockResolvedValue({ id: "entry" });
  const response = await editEntry(request({ amount: 12 }), { params: Promise.resolve({ id: "entry" }) });
  expect(response.status).toBe(200); expect(mocks.updateEntry).toHaveBeenCalledWith("entry", { amount: 12 });
});
it("returns validation failures without treating them as successful deletes", async () => {
  mocks.auth.mockResolvedValue({ user: { name: "test" } }); mocks.deleteCategory.mockRejectedValue(new Error("Delete subcategories first."));
  const response = await DELETE(request({ kind: "normal", id: "parent" }));
  expect(response.status).toBe(400); expect(await response.json()).toEqual({ error: "Delete subcategories first." });
});
