import { describe, expect, it, vi } from "vitest";
import { prepareDatabase } from "../scripts/prepare-database.mjs";

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
