import {
  buildClickhouseClientCommand,
  buildSshArgs,
  runSsh,
  optionalEnv,
} from "./_lib.mjs";

const main = async () => {
  const sql = process.argv.slice(2).join(" ").trim();
  if (!sql) {
    console.error('Usage: pnpm clickhouse:query "SELECT 1"');
    process.exit(2);
  }

  const db = optionalEnv("CLICKHOUSE_DB", "traderlaunchpad");
  const sshArgs = buildSshArgs();
  const remoteCommand = buildClickhouseClientCommand({
    database: db,
    multiquery: false,
    format: "PrettyCompactMonoblock",
    query: sql,
  });

  const { stdout } = await runSsh({ sshArgs, remoteCommand });
  process.stdout.write(stdout);
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

