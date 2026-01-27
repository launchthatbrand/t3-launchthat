import { spawn } from "node:child_process";

/** @param {string} key */
export const requiredEnv = (key) => {
  const v = process.env[key];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing required env var ${key}`);
  }
  return String(v);
};

/** @param {string} key @param {string} fallback */
export const optionalEnv = (key, fallback) => {
  const v = process.env[key];
  return v && String(v).trim() ? String(v) : fallback;
};

/** @param {unknown} value */
const shQuote = (value) => {
  // POSIX-safe single-quote wrapper.
  const s = String(value);
  return `'${s.replace(/'/g, `'\\''`)}'`;
};

export const buildSshArgs = () => {
  const host = requiredEnv("CLICKHOUSE_SSH_HOST");
  const user = optionalEnv("CLICKHOUSE_SSH_USER", "root");
  const port = optionalEnv("CLICKHOUSE_SSH_PORT", "22");
  const identityFile = process.env.CLICKHOUSE_SSH_IDENTITY_FILE
    ? String(process.env.CLICKHOUSE_SSH_IDENTITY_FILE)
    : null;

  /** @type {string[]} */
  const args = [];
  if (identityFile) args.push("-i", identityFile);
  if (port) args.push("-p", port);
  // Recommended hardening for automation.
  args.push("-o", "BatchMode=yes");
  args.push("-o", "StrictHostKeyChecking=accept-new");
  args.push(`${user}@${host}`);
  return args;
};

/**
 * @param {{
 *   database: string | null;
 *   multiquery: boolean;
 *   format: string | null;
 *   query: string | null;
 * }} args
 */
export const buildClickhouseClientCommand = ({
  database,
  multiquery,
  format,
  query,
}) => {
  const chUser = optionalEnv("CLICKHOUSE_USER", "default");
  const chPassword = process.env.CLICKHOUSE_PASSWORD
    ? String(process.env.CLICKHOUSE_PASSWORD)
    : "";

  const parts = [
    "clickhouse-client",
    "--host",
    "localhost",
    "--user",
    shQuote(chUser),
  ];
  if (database) {
    parts.push("--database", shQuote(database));
  }
  if (chPassword) {
    parts.push("--password", shQuote(chPassword));
  }
  if (multiquery) {
    parts.push("--multiquery");
  }
  if (format) {
    parts.push("--format", shQuote(format));
  }
  if (query) {
    parts.push("--query", shQuote(query));
  }
  return parts.join(" ");
};

/**
 * @param {{
 *   sshArgs: string[];
 *   remoteCommand: string;
 *   stdinText?: string;
 * }} args
 */
export const runSsh = async ({ sshArgs, remoteCommand, stdinText = undefined }) => {
  const runOnce = async () => {
    return await new Promise((resolve, reject) => {
      const child = spawn("ssh", [...sshArgs, remoteCommand], {
        stdio: ["pipe", "pipe", "pipe"],
        env: process.env,
      });

      let stdout = "";
      let stderr = "";
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (d) => {
        stdout += d;
      });
      child.stderr.on("data", (d) => {
        stderr += d;
      });

      child.on("error", reject);
      child.on("close", (code) => {
        resolve({ code, stdout, stderr });
      });

      if (stdinText) child.stdin.write(stdinText);
      child.stdin.end();
    });
  };

  /** @param {unknown} code @param {unknown} stderr */
  const isRetryableSshFailure = (code, stderr) => {
    // Common transient cases when the droplet is rebooting, SSH is rate-limited,
    // or the network temporarily refuses new connections.
    if (code !== 255) return false;
    const s = String(stderr || "");
    return (
      s.includes("Connection refused") ||
      s.includes("Connection timed out") ||
      s.includes("Operation timed out") ||
      s.includes("Connection reset by peer")
    );
  };

  /** @param {number} ms */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const maxAttempts = Number(process.env.CLICKHOUSE_SSH_RETRIES || 8);
  const baseDelayMs = Number(process.env.CLICKHOUSE_SSH_RETRY_DELAY_MS || 750);

  /** @type {{code:number|null, stdout:string, stderr:string}} */
  let last = { code: null, stdout: "", stderr: "" };

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    last = await runOnce();

    if (last.code === 0) return { stdout: last.stdout, stderr: last.stderr };

    if (!isRetryableSshFailure(last.code, last.stderr) || attempt === maxAttempts)
      break;

    await sleep(baseDelayMs * 2 ** (attempt - 1));
  }

  const err = new Error(
    `SSH command failed (exit ${last.code}).\n\nCommand: ssh ${sshArgs.join(
      " ",
    )} ${remoteCommand}\n\nstderr:\n${last.stderr}\n`,
  );
  // @ts-ignore attach for debugging
  err.stdout = last.stdout;
  // @ts-ignore attach for debugging
  err.stderr = last.stderr;
  throw err;
};

