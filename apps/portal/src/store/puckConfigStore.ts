import { createConfig, puckConfig } from "@acme/puck-config";

import type { Config } from "@measured/puck";
import { create } from "zustand";

interface PuckConfigState {
  config: Config;
  getEnhancedConfig: () => Config;
  resetConfig: () => void;
}

export const usePuckConfigStore = create<PuckConfigState>((set, get) => ({
  config: puckConfig,

  getEnhancedConfig: () => get().config,

  resetConfig: () =>
    set({
      config: createConfig(),
    }),
}));
