import fs from "node:fs/promises";
import path from "node:path";

import {
  buildClickhouseClientCommand,
  buildSshArgs,
  runSsh,
  optionalEnv,
} from "./_lib.mjs";

const MIGRATIONS_DEFAULT_DIR = "infra/clickhouse/migrations";

const parseArgs = () => {
  const args = process.argv.slice(2);
  /** @type {{dir: string; to: string | null; dryRun: boolean; verbose: boolean}} */
  const out = {
    dir: MIGRATIONS_DEFAULT_DIR,
    to: null,
    dryRun: false,
    verbose: false,
  };
  for (const a of args) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--verbose") out.verbose = true;
    else if (a.startsWith("--dir=")) out.dir = a.slice("--dir=".length);
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else {
      console.error(`Unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return out;
};

/** @param {{ sshArgs: string[]; db: string }} args */
const ensureBootstrap = async ({ sshArgs, db }) => {
  const bootstrapSql = [
    `CREATE DATABASE IF NOT EXISTS ${db};`,
    `CREATE TABLE IF NOT EXISTS ${db}.schema_migrations (`,
    `  name String,`,
    `  applied_at DateTime DEFAULT now()`,
    `) ENGINE = MergeTree ORDER BY (name);`,
  ].join("\n");

  const remoteCommand = buildClickhouseClientCommand({
    database: null,
    multiquery: true,
    format: null,
    query: null,
  });

  await runSsh({ sshArgs, remoteCommand, stdinText: bootstrapSql });
};

/** @param {{ sshArgs: string[]; db: string }} args */
const listApplied = async ({ sshArgs, db }) => {
  const remoteCommand = buildClickhouseClientCommand({
    database: db,
    multiquery: false,
    format: "TSVRaw",
    query: `SELECT name FROM schema_migrations ORDER BY name`,
  });
  const { stdout } = await runSsh({ sshArgs, remoteCommand });
  return new Set(
    stdout
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  );
};

const main = async () => {
  const { dir, to, dryRun, verbose } = parseArgs();
  const db = optionalEnv("CLICKHOUSE_DB", "traderlaunchpad");
  const sshArgs = buildSshArgs();

  await ensureBootstrap({ sshArgs, db });

  const absDir = path.resolve(process.cwd(), dir);
  const entries = await fs.readdir(absDir);
  const migrations = entries
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b, "en"));

  if (migrations.length === 0) {
    console.log(`No migrations found in ${dir}`);
    return;
  }

  const applied = await listApplied({ sshArgs, db });
  const pending = migrations.filter((m) => !applied.has(m));
  const limited =
    typeof to === "string" && to.trim()
      ? pending.filter((m) => m.localeCompare(to, "en") <= 0)
      : pending;

  if (limited.length === 0) {
    console.log("ClickHouse migrations up to date.");
    return;
  }

  console.log(
    `${dryRun ? "[dry-run] " : ""}Applying ${limited.length} migration(s) to ${db} via SSH...`,
  );

  for (const file of limited) {
    const fullPath = path.join(absDir, file);
    const sql = await fs.readFile(fullPath, "utf8");
    const stamped =
      `${sql.trim()}\n\n` +
      `INSERT INTO schema_migrations (name) VALUES ('${file.replace(/'/g, "''")}');\n`;

    if (verbose || dryRun) console.log(`- ${file}`);
    if (dryRun) continue;

    const remoteCommand = buildClickhouseClientCommand({
      database: db,
      multiquery: true,
      format: null,
      query: null,
    });

    await runSsh({ sshArgs, remoteCommand, stdinText: stamped });
  }

  console.log("Done.");
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

