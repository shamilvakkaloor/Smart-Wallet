import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

function worker() {
  const handlers = {};
  const fallback = new Response("offline screen");
  const cache = { add: vi.fn().mockResolvedValue(undefined) };
  const caches = { open: vi.fn().mockResolvedValue(cache), match: vi.fn().mockResolvedValue(fallback), keys: vi.fn().mockResolvedValue([]), delete: vi.fn() };
  const fetch = vi.fn();
  const self = { location: { origin: "https://wallet.test" }, addEventListener: (name, handler) => { handlers[name] = handler; }, skipWaiting: vi.fn(), clients: { claim: vi.fn() } };
  vm.runInNewContext(readFileSync("public/sw.js", "utf8"), { self, caches, fetch, URL, Response });
  return { handlers, caches, cache, fetch, fallback };
}

describe("web app installation", () => {
  it("ships correctly sized, local PNG icons and a standalone manifest", () => {
    const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));
    expect(manifest.display).toBe("standalone");
    expect(manifest.scope).toBe("/");
    expect(manifest.icons.some(icon => icon.sizes === "192x192")).toBe(true);
    expect(manifest.icons.some(icon => icon.sizes === "512x512")).toBe(true);
    for (const icon of manifest.icons) {
      const png = readFileSync("public" + icon.src);
      expect(png.subarray(1, 4).toString()).toBe("PNG");
      expect(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`).toBe(icon.sizes);
    }
  });
  it("only precaches the public offline screen", async () => {
    const { handlers, cache } = worker();
    let work;
    handlers.install({ waitUntil: promise => { work = promise; } });
    await work;
    expect(cache.add).toHaveBeenCalledExactlyOnceWith("/offline.html");
  });
  it("never intercepts APIs, receipts, POSTs or cross-origin requests", () => {
    const { handlers, fetch } = worker();
    for (const request of [
      { url: "https://wallet.test/api/backup", method: "GET", mode: "navigate" },
      { url: "https://wallet.test/api/attachments/receipt", method: "GET", mode: "navigate" },
      { url: "https://wallet.test/entries", method: "POST", mode: "navigate" },
      { url: "https://another.test/", method: "GET", mode: "navigate" },
      { url: "https://wallet.test/entries", method: "GET", mode: "cors" },
    ]) {
      const respondWith = vi.fn(); handlers.fetch({ request, respondWith });
      expect(respondWith).not.toHaveBeenCalled();
    }
    expect(fetch).not.toHaveBeenCalled();
  });
  it("serves a fresh navigation response without caching financial pages", async () => {
    const { handlers, fetch, caches } = worker();
    const response = new Response("private wallet"); fetch.mockResolvedValue(response);
    let work;
    handlers.fetch({ request: { url: "https://wallet.test/wallets", method: "GET", mode: "navigate" }, respondWith: promise => { work = promise; } });
    expect(await work).toBe(response);
    expect(caches.open).not.toHaveBeenCalled(); expect(caches.match).not.toHaveBeenCalled();
  });
  it("shows the generic offline page when navigation cannot reach the network", async () => {
    const { handlers, fetch, fallback } = worker(); fetch.mockRejectedValue(new Error("offline"));
    let work;
    handlers.fetch({ request: { url: "https://wallet.test/wallets", method: "GET", mode: "navigate" }, respondWith: promise => { work = promise; } });
    expect(await work).toBe(fallback);
  });
});
