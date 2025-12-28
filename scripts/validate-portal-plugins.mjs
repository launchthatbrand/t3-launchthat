import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const packagesDir = path.join(repoRoot, "packages");

const isDirectory = (p) => {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
};

const readText = (p) => fs.readFileSync(p, "utf8");

const fail = (message) => {
  // eslint-disable-next-line no-console
  console.error(`\n[portal-plugins] ERROR: ${message}\n`);
  process.exitCode = 1;
};

const warn = (message) => {
  // eslint-disable-next-line no-console
  console.warn(`[portal-plugins] WARN: ${message}`);
};

const ok = (message) => {
  // eslint-disable-next-line no-console
  console.log(`[portal-plugins] ${message}`);
};

const pluginDirs = fs
  .readdirSync(packagesDir)
  .filter((name) => name.startsWith("launchthat-plugin-"))
  .filter((name) => name !== "launchthat-plugin-core")
  .map((name) => path.join(packagesDir, name))
  .filter(isDirectory);

if (pluginDirs.length === 0) {
  ok("No portal plugins found under packages/launchthat-plugin-*");
  process.exit(0);
}

const hookStringLiterals = [
  "admin.archive.header.",
  "admin.archive.content.",
  "admin.plugin.settings.header.",
  "admin.attachments.archive.tabs.filter",
  "frontend.single.slots",
];

const providerIdsByPlugin = new Map();
const allProviderIds = new Map();

for (const pluginDir of pluginDirs) {
  const pkgJsonPath = path.join(pluginDir, "package.json");
  const srcDir = path.join(pluginDir, "src");
  const pluginTs = path.join(srcDir, "plugin.ts");
  const indexTs = path.join(srcDir, "index.ts");
  const indexTsx = path.join(srcDir, "index.tsx");

  const pkgName = path.basename(pluginDir);
  const pluginId = pkgName.replace(/^launchthat-plugin-/, "");

  if (!fs.existsSync(pkgJsonPath)) {
    fail(`${pkgName}: missing package.json`);
    continue;
  }

  const pkgJson = JSON.parse(readText(pkgJsonPath));
  if (pkgJson.name !== pkgName) {
    fail(`${pkgName}: package.json name must be "${pkgName}" (found "${pkgJson.name}")`);
  }

  const isMigrated = fs.existsSync(pluginTs) && fs.existsSync(indexTs);
  if (!isMigrated) {
    // Legacy plugin: allowed during progressive migration.
    // We still validate the package exists and exports a root entry.
    const hasRootExport = Boolean(pkgJson.exports?.["."]);
    if (!hasRootExport) {
      fail(`${pkgName}: legacy plugin is missing exports["."]. Add exports or migrate.`);
    } else {
      warn(
        `${pkgName}: legacy plugin (missing src/plugin.ts and/or src/index.ts). Skipping strict validation until migrated.`,
      );
    }
    continue;
  }

  // Strict validation for migrated plugins
  const pluginContent = readText(pluginTs);
  const indexContent = readText(indexTs);

  if (!pluginContent.includes(`export const PLUGIN_ID = "${pluginId}" as const;`)) {
    fail(`${pkgName}: src/plugin.ts must export PLUGIN_ID = "${pluginId}"`);
  }

  if (!/export const create[A-Za-z0-9_]+PluginDefinition\s*=/.test(pluginContent)) {
    fail(`${pkgName}: src/plugin.ts must export create<PluginName>PluginDefinition`);
  }

  if (!/export const [a-z][A-Za-z0-9_]*Plugin: PluginDefinition\s*=/.test(pluginContent)) {
    fail(`${pkgName}: src/plugin.ts must export <camel>Plugin: PluginDefinition`);
  }

  if (!/export default [a-z][A-Za-z0-9_]*Plugin;/.test(indexContent)) {
    fail(`${pkgName}: src/index.ts must default-export the concrete plugin definition`);
  }

  // Hook strings should use constants from launchthat-plugin-core/hookSlots
  for (const needle of hookStringLiterals) {
    if (pluginContent.includes(needle)) {
      fail(`${pkgName}: src/plugin.ts contains hook string literal "${needle}". Import from launchthat-plugin-core/hookSlots.`);
      break;
    }
  }

  // Best-effort provider collision detection (string-literal keys only).
  // This intentionally ignores computed keys like {[SOME_CONST]: Provider}.
  const providerBlock = pluginContent.match(/providers\\s*:\\s*\\{([\\s\\S]*?)\\n\\s*\\}/m);
  if (providerBlock) {
    const block = providerBlock[1] ?? "";
    const literalKeys = Array.from(block.matchAll(/['"]([^'"]+)['"]\\s*:/g)).map(
      (m) => m[1],
    );
    if (literalKeys.length > 0) {
      providerIdsByPlugin.set(pluginId, literalKeys);
      for (const providerId of literalKeys) {
        const owner = allProviderIds.get(providerId);
        if (owner && owner !== pluginId) {
          warn(
            `${pkgName}: providerId "${providerId}" is also declared by "${owner}". Provider IDs should be globally unique across plugins.`,
          );
        } else {
          allProviderIds.set(providerId, pluginId);
        }
      }
    }
  }

  // Ensure package.json root export points at src/index.ts
  const rootExport = pkgJson.exports?.["."]?.default;
  if (rootExport !== "./src/index.ts") {
    fail(`${pkgName}: exports["."].default must be "./src/index.ts" for migrated plugins (found "${rootExport}")`);
  }

  // Ensure we didn't accidentally leave a TSX-only root entry
  if (fs.existsSync(indexTsx)) {
    warn(`${pkgName}: src/index.tsx exists; prefer src/index.ts as the package entrypoint.`);
  }
}

if (process.exitCode === 1) {
  process.exit(1);
}

ok("Portal plugin validation passed.");


