import type { VimeoHookBag } from "./types";

let registeredHooks: VimeoHookBag | null = null;

export function configureVimeoPlugin(hooks: VimeoHookBag) {
  registeredHooks = hooks;
}

export function getConfiguredVimeoHooks(): VimeoHookBag | null {
  return registeredHooks;
}
