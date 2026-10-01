// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EntryForm, type EntryCategory } from "../components/entry-form";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn() }) }));
const categories: EntryCategory[] = [
  { id: "food", name: "Food", type: "EXPENSE", parentId: null },
  { id: "dining", name: "Dining", type: "EXPENSE", parentId: "food" },
  { id: "travel", name: "Travel", type: "EXPENSE", parentId: null },
  { id: "salary", name: "Salary", type: "INCOME", parentId: null },
];
const props = { initialType: "EXPENSE", currencies: [{ id: "omr", code: "OMR" }], categories, accounts: [{ id: "cash", accountName: "Cash", currencyId: "omr", currency: { code: "OMR" } }, { id: "bank", accountName: "Bank", currencyId: "omr", currency: { code: "OMR" } }] };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("shows parent categories first and clears the optional child when parent changes", () => {
  render(<EntryForm {...props}/>);
  expect(screen.queryByLabelText("Subcategory (optional)")).toBeNull();
  expect(screen.queryByRole("option", { name: "Dining" })).toBeNull();
  expect(screen.queryByRole("option", { name: "Salary" })).toBeNull();
  fireEvent.change(screen.getByLabelText("Category"), { target: { value: "food" } });
  fireEvent.change(screen.getByLabelText("Subcategory (optional)"), { target: { value: "dining" } });
  fireEvent.change(screen.getByLabelText("Category"), { target: { value: "travel" } });
  expect(screen.queryByLabelText("Subcategory (optional)")).toBeNull();
  fireEvent.change(screen.getByLabelText("Category"), { target: { value: "food" } });
  expect((screen.getByLabelText("Subcategory (optional)") as HTMLSelectElement).value).toBe("");
});
it("assigns the single amount automatically to its account and allows parent-only selection", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "saved" }) }); vi.stubGlobal("fetch", fetcher);
  render(<EntryForm {...props}/>);
  expect(screen.queryByLabelText("Account 1 amount")).toBeNull();
  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "20" } });
  fireEvent.change(screen.getByLabelText("Account 1"), { target: { value: "cash" } });
  fireEvent.change(screen.getByLabelText("Category"), { target: { value: "food" } });
  fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Dinner" } });
  fireEvent.submit(screen.getByRole("button", { name: "Save entry" }).closest("form")!);
  await waitFor(() => expect(fetcher).toHaveBeenCalled());
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({ amount: 20, categoryId: "food", allocations: [{ accountId: "cash", amount: 20 }] });
});
it("shows split amounts only after splitting and returns to one amount when removed", () => {
  render(<EntryForm {...props}/>);
  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "20" } });
  fireEvent.click(screen.getByRole("button", { name: "+ Split across accounts" }));
  expect((screen.getByLabelText("Account 1 amount") as HTMLInputElement).value).toBe("20");
  expect(screen.getByLabelText("Total amount")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Remove account 2" }));
  expect(screen.queryByLabelText("Account 1 amount")).toBeNull();
  expect((screen.getByLabelText("Amount") as HTMLInputElement).value).toBe("20");
});
it("prefills editing and submits the version and chosen subcategory", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "existing" }) }); vi.stubGlobal("fetch", fetcher);
  render(<EntryForm {...props} entry={{ id: "existing", type: "EXPENSE", updatedAt: "2026-10-01T00:00:00.000Z", transactionDate: "2026-10-01", amount: 12, currencyId: "omr", categoryId: "dining", description: "Dinner", notes: "", allocations: [{ accountId: "cash", amount: 12 }], transfer: null, exchange: null }}/>);
  expect((screen.getByLabelText("Category") as HTMLSelectElement).value).toBe("food");
  expect((screen.getByLabelText("Subcategory (optional)") as HTMLSelectElement).value).toBe("dining");
  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "15" } });
  fireEvent.submit(screen.getByRole("button", { name: "Save changes" }).closest("form")!);
  await waitFor(() => expect(fetcher).toHaveBeenCalled());
  expect(fetcher.mock.calls[0][0]).toBe("/api/entries/existing");
  expect(fetcher.mock.calls[0][1].method).toBe("PATCH");
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({ updatedAt: "2026-10-01T00:00:00.000Z", amount: 15, categoryId: "dining", allocations: [{ accountId: "cash", amount: 15 }] });
});
