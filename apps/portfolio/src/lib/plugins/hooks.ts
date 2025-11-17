import type { Plugin, PluginContext, PluginTab } from "./types";
import { useEffect, useMemo, useState } from "react";

import { pluginRegistry } from "./registry";

// Hook to get active plugins
export const useActivePlugins = (): Plugin[] => {
  const [activePlugins, setActivePlugins] = useState<Plugin[]>(() =>
    pluginRegistry.getActivePlugins(),
  );

  useEffect(() => {
    const updateActivePlugins = () => {
      setActivePlugins(pluginRegistry.getActivePlugins());
    };

    pluginRegistry.on("plugin:activated", updateActivePlugins);
    pluginRegistry.on("plugin:deactivated", updateActivePlugins);

    return () => {
      pluginRegistry.off("plugin:activated", updateActivePlugins);
      pluginRegistry.off("plugin:deactivated", updateActivePlugins);
    };
  }, []);

  return activePlugins;
};

// Hook to get slot components
export const useSlotComponents = (
  slotName: string,
  context: PluginContext,
): React.ComponentType<PluginContext>[] => {
  const activePlugins = useActivePlugins();

  return useMemo(() => {
    return pluginRegistry.getSlotComponents(slotName, context);
  }, [slotName, context, activePlugins]);
};

// Hook to get plugin tabs
export const usePluginTabs = (
  area: string,
  context: PluginContext,
): PluginTab[] => {
  const activePlugins = useActivePlugins();

  return useMemo(() => {
    return pluginRegistry.getTabsForArea(area, context);
  }, [area, context, activePlugins]);
};

// Hook to get sidebar components
export const useSidebarComponents = (
  position: "top" | "bottom",
  context: PluginContext,
): React.ComponentType<PluginContext>[] => {
  const activePlugins = useActivePlugins();

  return useMemo(() => {
    return pluginRegistry.getSidebarComponents(position, context);
  }, [position, context, activePlugins]);
};

// Hook to check if a plugin is active
export const useIsPluginActive = (pluginId: string): boolean => {
  const [isActive, setIsActive] = useState(() =>
    pluginRegistry.isPluginActive(pluginId),
  );

  useEffect(() => {
    const checkActiveStatus = () => {
      setIsActive(pluginRegistry.isPluginActive(pluginId));
    };

    pluginRegistry.on("plugin:activated", checkActiveStatus);
    pluginRegistry.on("plugin:deactivated", checkActiveStatus);

    return () => {
      pluginRegistry.off("plugin:activated", checkActiveStatus);
      pluginRegistry.off("plugin:deactivated", checkActiveStatus);
    };
  }, [pluginId]);

  return isActive;
};

// Hook to manage plugin activation
export const usePluginActivation = (pluginId: string) => {
  const isActive = useIsPluginActive(pluginId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const activate = async (context?: PluginContext) => {
    setIsLoading(true);
    setError(null);
    try {
      await pluginRegistry.activate(pluginId, context);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const deactivate = async (context?: PluginContext) => {
    setIsLoading(true);
    setError(null);
    try {
      await pluginRegistry.deactivate(pluginId, context);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isActive,
    isLoading,
    error,
    activate,
    deactivate,
  };
};
