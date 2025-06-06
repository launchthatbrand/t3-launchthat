/**
 * Integration Plugin System
 *
 * This module provides a plugin architecture for loading integration
 * definitions dynamically into the rules engine.
 */

import { IntegrationDefinition, IntegrationRegistry } from "./registry";

/**
 * Interface for integration plugins
 */
export interface IntegrationPlugin {
  /**
   * Gets the integration definition
   * @returns The integration definition
   */
  getDefinition(): IntegrationDefinition;

  /**
   * Initializes the plugin
   * @returns A promise that resolves when initialization is complete
   */
  initialize(): Promise<void>;

  /**
   * Validates the plugin configuration
   * @param config Optional configuration object
   * @returns A promise that resolves to true if the configuration is valid
   * @throws Error if the configuration is invalid
   */
  validateConfig?(config?: Record<string, unknown>): Promise<boolean>;

  /**
   * Tears down the plugin
   * @returns A promise that resolves when teardown is complete
   */
  teardown?(): Promise<void>;
}

/**
 * Options for loading a plugin
 */
export interface PluginLoadOptions {
  /**
   * Configuration object for the plugin
   */
  config?: Record<string, unknown>;

  /**
   * Whether to validate the plugin configuration
   * @default true
   */
  validateConfig?: boolean;
}

/**
 * Result of loading a plugin
 */
export interface PluginLoadResult {
  /**
   * Whether the plugin was loaded successfully
   */
  success: boolean;

  /**
   * The integration ID of the loaded plugin
   */
  integrationId: string;

  /**
   * Error message if loading failed
   */
  error?: string;

  /**
   * Additional details about the loading process
   */
  details?: Record<string, unknown>;
}

/**
 * Loader for integration plugins
 */
export class IntegrationPluginLoader {
  private registry: IntegrationRegistry;
  private loadedPlugins: Map<string, IntegrationPlugin>;

  /**
   * Creates a new instance of IntegrationPluginLoader
   * @param registry The integration registry to register plugins with
   */
  constructor(registry: IntegrationRegistry) {
    this.registry = registry;
    this.loadedPlugins = new Map<string, IntegrationPlugin>();
  }

  /**
   * Loads a plugin into the registry
   * @param plugin The plugin to load
   * @param options Options for loading the plugin
   * @returns A promise that resolves to the load result
   */
  async loadPlugin(
    plugin: IntegrationPlugin,
    options: PluginLoadOptions = {},
  ): Promise<PluginLoadResult> {
    const result: PluginLoadResult = {
      success: false,
      integrationId: "",
    };

    try {
      // Initialize the plugin
      await plugin.initialize();

      // Get the integration definition
      const definition = plugin.getDefinition();
      result.integrationId = definition.id;

      // Validate config if requested
      if (options.validateConfig !== false && plugin.validateConfig) {
        const isValid = await plugin.validateConfig(options.config);
        if (!isValid) {
          throw new Error(
            `Plugin configuration validation failed for ${definition.id}`,
          );
        }
      }

      // Register the integration with the registry
      this.registry.registerIntegration(definition);

      // Store the loaded plugin
      this.loadedPlugins.set(definition.id, plugin);

      result.success = true;
      result.details = {
        name: definition.name,
        version: definition.version,
        triggerCount: definition.triggers.length,
        conditionCount: definition.conditions.length,
        actionCount: definition.actions.length,
      };

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      result.error = err.message;
      result.details = {
        stack: err.stack,
      };

      return result;
    }
  }

  /**
   * Unloads a plugin from the registry
   * @param integrationId The ID of the integration to unload
   * @returns A promise that resolves to true if the plugin was unloaded, false otherwise
   */
  async unloadPlugin(integrationId: string): Promise<boolean> {
    const plugin = this.loadedPlugins.get(integrationId);
    if (!plugin) {
      return false;
    }

    try {
      // Call teardown if it exists
      if (plugin.teardown) {
        await plugin.teardown();
      }

      // Unregister from the registry
      this.registry.unregisterIntegration(integrationId);

      // Remove from loaded plugins
      this.loadedPlugins.delete(integrationId);

      return true;
    } catch (error) {
      console.error(`Error unloading plugin ${integrationId}:`, error);
      return false;
    }
  }

  /**
   * Gets a loaded plugin by ID
   * @param integrationId The ID of the integration
   * @returns The plugin, or undefined if not found
   */
  getPlugin(integrationId: string): IntegrationPlugin | undefined {
    return this.loadedPlugins.get(integrationId);
  }

  /**
   * Gets all loaded plugins
   * @returns An array of plugin IDs
   */
  getLoadedPluginIds(): string[] {
    return Array.from(this.loadedPlugins.keys());
  }

  /**
   * Checks if a plugin is loaded
   * @param integrationId The ID of the integration
   * @returns True if the plugin is loaded, false otherwise
   */
  isPluginLoaded(integrationId: string): boolean {
    return this.loadedPlugins.has(integrationId);
  }
}
