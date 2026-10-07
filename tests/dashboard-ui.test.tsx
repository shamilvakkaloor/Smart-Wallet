// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DashboardOverview } from "../components/dashboard-overview";
import { money } from "../lib/format";
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a> }));
vi.mock("../components/dashboard-chart", () => ({ DashboardChart: ({ code }: { code: string }) => <div aria-label={`${code} chart`}/> }));
const position = [ { id: "omr", code: "OMR", decimals: 3, balance: 100, available: 90, receivable: 10, payable: 0, accounts: [] }, { id: "inr", code: "INR", decimals: 2, balance: 1000, available: 1000, receivable: 0, payable: 0, accounts: [] } ];
afterEach(cleanup);
it("filters balance cards and charts to the chosen currency and restores both", () => {
  render(<DashboardOverview position={position} activity={[]} monthLabel="October 2026"/>);
  expect(screen.getByLabelText("OMR chart")).toBeTruthy(); expect(screen.getByLabelText("INR chart")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "OMR" }));
  expect(screen.queryByLabelText("INR chart")).toBeNull(); expect(screen.queryByText("Indian Rupee")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Both" }));
  expect(screen.getByLabelText("INR chart")).toBeTruthy();
});
it("explains the real balance formula and offers an empty-state action", () => {
  const { unmount } = render(<DashboardOverview position={position} activity={[]} monthLabel="October 2026"/>);
  expect(screen.getAllByRole("button", { name: "Available money + money owed to you − money you owe." })).toHaveLength(2);
  unmount(); render(<DashboardOverview position={[]} activity={[]} monthLabel="October 2026"/>);
  expect(screen.getByRole("link", { name: "Open Settings" }).getAttribute("href")).toBe("/settings");
});
it("keeps OMR precision and Indian rupee grouping", () => {
  expect(money(201.545,"OMR")).toContain("201.545");
  expect(money(1234567.5,"INR")).toContain("12,34,567.50");
});

it("uses meaningful zero messages without hiding negative debt balances",()=>{render(<DashboardOverview position={[{...position[0],balance:0,available:0,receivable:0,payable:-5}]} activity={[]} monthLabel="October 2026"/>);expect(screen.getByText('No net balance')).toBeTruthy();expect(screen.getByText('No available funds')).toBeTruthy();expect(screen.getByText('Nothing to receive')).toBeTruthy();expect(screen.getByText('No income this period')).toBeTruthy();expect(screen.queryByText('No outstanding debt')).toBeNull();expect(screen.getByText((_,el)=>el?.tagName==='STRONG'&&el.textContent===money(-5,'OMR',3))).toBeTruthy()});
