// @vitest-environment jsdom
import {afterEach,expect,it,vi} from "vitest";
import {cleanup,render,screen,fireEvent,waitFor} from "@testing-library/react";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
import {ImportCleanup} from "../components/import-cleanup";
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
it("requires review and exact typed confirmation before bulk voiding",async()=>{const fetch=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({count:205,version:"a".repeat(64)})}).mockResolvedValueOnce({ok:true,json:async()=>({voided:205})});vi.stubGlobal("fetch",fetch);render(<ImportCleanup/>);expect(screen.queryByRole("button",{name:"Void all Excel imports"})).toBeNull();fireEvent.click(screen.getByRole("button",{name:"Review all Excel imports"}));await screen.findByText("205 imported entries will be voided");const button=screen.getByRole("button",{name:"Void all Excel imports"}) as HTMLButtonElement;expect(button.disabled).toBe(true);fireEvent.change(screen.getByRole("textbox"),{target:{value:"VOID ALL EXCEL IMPORTS"}});expect(button.disabled).toBe(false);fireEvent.click(button);await waitFor(()=>expect(screen.getByRole("status").textContent).toContain("205 Excel-imported entries voided"));expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({version:"a".repeat(64),confirmation:"VOID ALL EXCEL IMPORTS"})});
