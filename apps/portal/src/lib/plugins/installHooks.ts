import { pluginDefinitions } from "./definitions";
import {
  bootstrapPluginDefinitions,
  registerPluginDefinitionHooks,
} from "./registerHooks";

import "../frontendSlots/registerCoreFrontendSlots";
import "../frontendRouting/registerCoreRouteHandlers";
import "../frontendRouting/postStores/registerCorePostStores";

// Server-safe: admin bootstraps may register client-only metabox modules.
// We only run those bootstraps in the browser.
if (typeof window !== "undefined") {
bootstrapPluginDefinitions(pluginDefinitions);
}
registerPluginDefinitionHooks(pluginDefinitions);
