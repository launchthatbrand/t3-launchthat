import { config as baseConfig } from "@/components/puckeditor/config/puck-config";
import { type Id } from "@/convex/_generated/dataModel";
import { type Config } from "@measured/puck";
import { create } from "zustand";

type SelectOption = {
  label: string;
  value: string;
};

interface PuckConfigState {
  // Base configuration
  config: Config;

  // Options for various entity selectors
  groupOptions: SelectOption[];
  currentGroupId: Id<"groups"> | undefined;

  // Actions
  setGroupOptions: (options: SelectOption[], currentId?: Id<"groups">) => void;
  setCurrentGroupId: (id: Id<"groups"> | undefined) => void;

  // Get the current enhanced config with all dynamic options
  getEnhancedConfig: () => Config;
}

export const usePuckConfigStore = create<PuckConfigState>((set, get) => ({
  // Initialize with base configuration
  config: baseConfig,

  // Default empty options
  groupOptions: [],
  currentGroupId: undefined,

  // Action to set group options
  setGroupOptions: (options, currentId) =>
    set({
      groupOptions: options,
      currentGroupId: currentId || get().currentGroupId,
    }),

  // Action to set current group ID
  setCurrentGroupId: (id) => set({ currentGroupId: id }),

  // Get enhanced config with all dynamic options
  getEnhancedConfig: () => {
    const state = get();

    // Create a deep copy of the config to avoid mutating the original
    const enhancedConfig = JSON.parse(JSON.stringify(state.config));

    // Update all group selector fields
    Object.keys(enhancedConfig.components).forEach((key) => {
      const component = enhancedConfig.components[key];

      // Handle group fields
      if (key.startsWith("Group") && component.fields.groupId) {
        // Set options for group selector
        component.fields.groupId.options = state.groupOptions;

        // Set default prop if we have a current group
        if (state.currentGroupId && component.defaultProps) {
          component.defaultProps.groupId = state.currentGroupId;
        }
      }

      // Add other entity type fields here as needed
      // Example: if (component.fields.productId) { ... }
    });

    return enhancedConfig;
  },
}));
