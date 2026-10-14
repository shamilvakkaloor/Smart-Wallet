import { describe, expect, it, vi } from "vitest";
import { prepareDatabase, ensureSchemaEngineExecutable } from "../scripts/prepare-database.mjs";

describe("Prisma schema engine deployment permissions", () => {
  it("restores owner execute permission without opening write access", () => {
    const io = {
      readdirSync: vi.fn().mockReturnValue(["schema-engine-debian-openssl-1.1.x", "schema-engine-windows.exe", "package.json"]),
      statSync: vi.fn().mockReturnValue({ isFile: () => true, mode: 0o100644 }),
      chmodSync: vi.fn(),
    };
    ensureSchemaEngineExecutable("linux", io);
    expect(io.chmodSync).toHaveBeenCalledExactlyOnceWith(expect.stringContaining("schema-engine-debian-openssl-1.1.x"), 0o744);
  });
  it("leaves executable engines unchanged", () => {
    const io = {
      readdirSync: vi.fn().mockReturnValue(["schema-engine-debian-openssl-1.1.x"]),
      statSync: vi.fn().mockReturnValue({ isFile: () => true, mode: 0o100755 }),
      chmodSync: vi.fn(),
    };
    ensureSchemaEngineExecutable("linux", io);
    expect(io.chmodSync).not.toHaveBeenCalled();
  });
  it("does not change Windows file permissions", () => {
    const io = { readdirSync: vi.fn() };
    ensureSchemaEngineExecutable("win32", io);
    expect(io.readdirSync).not.toHaveBeenCalled();
  });
});

describe("optional deployment database setup", () => {
  it("does not touch a database unless explicitly enabled", () => {
    const run = vi.fn();
    prepareDatabase({ DATABASE_URL: "mysql://unused" }, run);
    expect(run).not.toHaveBeenCalled();
  });
  it("requires the database setting before launching commands", () => {
    const run = vi.fn();
    expect(() => prepareDatabase({ RUN_DB_SETUP: "true" }, run)).toThrow("Set DATABASE_URL");
    expect(run).not.toHaveBeenCalled();
  });
  it("applies migrations before seeding", () => {
    const run = vi.fn().mockReturnValue({ status: 0 });
    prepareDatabase({ RUN_DB_SETUP: "true", DATABASE_URL: "mysql://unused" }, run);
    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[0][1].slice(1)).toEqual(["migrate", "deploy"]);
    expect(run.mock.calls[1][1].slice(1)).toEqual(["prisma/seed.ts"]);
  });
  it("stops on migration failure without seeding", () => {
    const run = vi.fn().mockReturnValue({ status: 1 });
    expect(() => prepareDatabase({ RUN_DB_SETUP: "true", DATABASE_URL: "mysql://unused" }, run)).toThrow("migrations failed");
    expect(run).toHaveBeenCalledTimes(1);
  });
  it("reports a seed failure instead of continuing the build", () => {
    const run = vi.fn().mockReturnValueOnce({ status: 0 }).mockReturnValueOnce({ status: 1 });
    expect(() => prepareDatabase({ RUN_DB_SETUP: "true", DATABASE_URL: "mysql://unused" }, run)).toThrow("starter data failed");
  });
});
