import { pluginDefinitions } from "./definitions";
import {
  bootstrapPluginDefinitions,
  registerPluginDefinitionHooks,
} from "./registerHooks";

// Server-safe: admin bootstraps may register client-only metabox modules.
// We only run those bootstraps in the browser.
if (typeof window !== "undefined") {
  bootstrapPluginDefinitions(pluginDefinitions);
}
registerPluginDefinitionHooks(pluginDefinitions);
