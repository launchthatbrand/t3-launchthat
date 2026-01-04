import "server-only";
// Ensure plugin definitions register their filters/actions.
import "./installHooks";
import "../frontendSlots/registerCoreFrontendSlots";

import { registerCorePostStores } from "../frontendRouting/postStores/registerCorePostStores";
// Server-only registrations (may import server-only modules like Clerk).
// Explicitly invoke registration functions to avoid relying on side-effect-only imports.
import { registerCoreRouteHandlers } from "../frontendRouting/registerCoreRouteHandlers";

registerCoreRouteHandlers();
registerCorePostStores();

if (process.env.NODE_ENV !== "production") {
  const g = globalThis as unknown as {
    __portal_install_hooks_server_logged?: boolean;
  };
  if (!g.__portal_install_hooks_server_logged) {
    g.__portal_install_hooks_server_logged = true;
    console.log("[plugins] installHooks.server loaded");
  }
}
