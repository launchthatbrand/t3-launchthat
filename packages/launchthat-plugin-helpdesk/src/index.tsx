/**
 * @deprecated The dedicated helpdesk plugin has been merged into the unified
 * `launchthat-plugin-support` package. This file now re-exports that plugin so
 * existing imports keep working while we complete the transition.
 */
import { createRequire } from "module";
import type { PluginDefinition } from "launchthat-plugin-core";

type SupportModuleShape = {
  supportPlugin?: PluginDefinition;
  default?: PluginDefinition;
};

// Use a CommonJS-style require so we don't need to pull in the full TypeScript
// surface area of the support plugin (which drags in React 19-only types).
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const supportModule = (require("launchthat-plugin-support") ??
  {}) as SupportModuleShape;

const resolvedPlugin = supportModule.supportPlugin ?? supportModule.default;

if (!resolvedPlugin) {
  throw new Error(
    "launchthat-plugin-helpdesk could not load launchthat-plugin-support. Make sure it is installed in the workspace.",
  );
}

export const helpdeskPlugin: PluginDefinition = resolvedPlugin;

export default helpdeskPlugin;
