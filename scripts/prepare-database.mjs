import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chmodSync, readdirSync, statSync } from "node:fs";

// Some deployment archive restores strip the executable bit from Prisma's
// downloaded schema engine. Restore owner execute permission before migration.
export function ensureSchemaEngineExecutable(platform = process.platform, io = { chmodSync, readdirSync, statSync }) {
  if (platform === "win32") return;
  const directory = resolve("node_modules/@prisma/engines");
  for (const name of io.readdirSync(directory)) {
    if (!name.startsWith("schema-engine-") || name.endsWith(".exe")) continue;
    const file = resolve(directory, name);
    const stat = io.statSync(file);
    if (stat.isFile() && !(stat.mode & 0o100)) io.chmodSync(file, (stat.mode & 0o777) | 0o100);
  }
}

export function prepareDatabase(env = process.env, run = spawnSync) {
  if (env.RUN_DB_SETUP !== "true") {
    console.log("Database setup skipped (RUN_DB_SETUP is not true).");
    return;
  }
  if (!env.DATABASE_URL?.trim()) throw new Error("Set DATABASE_URL in Hostinger before enabling RUN_DB_SETUP.");
  ensureSchemaEngineExecutable();
  const commands = [
    ["Apply database migrations", "node_modules/prisma/build/index.js", "migrate", "deploy"],
    ["Add starter data", "node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"],
  ];
  for (const [label, script, ...args] of commands) {
    console.log(`${label}...`);
    const result = run(process.execPath, [resolve(script), ...args], { stdio: "inherit", env });
    if (result.error || result.status !== 0) throw new Error(`${label} failed. Check the deployment log; the build has been stopped.`);
  }
  console.log("Database setup completed.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { prepareDatabase(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
