import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function prepareDatabase(env = process.env, run = spawnSync) {
  if (env.RUN_DB_SETUP !== "true") {
    console.log("Database setup skipped (RUN_DB_SETUP is not true).");
    return;
  }
  if (!env.DATABASE_URL?.trim()) throw new Error("Set DATABASE_URL in Hostinger before enabling RUN_DB_SETUP.");
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
