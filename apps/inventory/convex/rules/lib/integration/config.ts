/**
 * Integration Config Manager
 *
 * This module provides a configuration manager for integration settings
 * that works with the Convex data model.
 */

import { ConvexClient } from "convex/browser";

import { Id } from "../../../_generated/dataModel";
import { safeParseJson, safeStringifyJson } from "../utils";

// Integration document type from schema
export interface IntegrationDoc {
  _id: Id<"integrations">;
  _creationTime: number;
  name: string;
  type: string;
  description?: string;
  isEnabled: boolean;
  apiKey: string;
  apiEndpoint?: string;
  refreshToken?: string;
  lastConnectionCheck?: number;
  connectionStatus?: string;
  lastError?: string;
  consecutiveErrorCount?: number;
  config?: string;
  metadata?: string;
}

/**
 * Common configuration fields for all integrations
 */
export interface IntegrationConfig {
  enabled: boolean;
  name: string;
  description?: string;
  apiKey?: string;
  apiEndpoint?: string;
  // Integration-specific configuration stored as JSON
  settings: Record<string, unknown>;
}

/**
 * Integration configuration manager for handling integration configurations
 */
export class IntegrationConfigManager {
  private convex: ConvexClient;
  private cache: Map<string, IntegrationConfig>;

  /**
   * Creates a new instance of IntegrationConfigManager
   * @param convex The Convex client
   */
  constructor(convex: ConvexClient) {
    this.convex = convex;
    this.cache = new Map<string, IntegrationConfig>();
  }

  /**
   * Gets the configuration for an integration
   * @param integrationId The ID of the integration
   * @returns A promise that resolves to the integration configuration
   */
  async getConfig(integrationId: string): Promise<IntegrationConfig | null> {
    // Check cache first
    if (this.cache.has(integrationId)) {
      return this.cache.get(integrationId) ?? null;
    }

    try {
      // Fetch from database
      const integration = (await this.convex.query(
        "rules.getIntegrationConfig",
        {
          id: integrationId,
        },
      )) as {
        id: Id<"integrations">;
        name: string;
        type: string;
        isEnabled: boolean;
        config: Record<string, unknown>;
      } | null;

      if (!integration) {
        return null;
      }

      // Create config object
      const config: IntegrationConfig = {
        enabled: integration.isEnabled,
        name: integration.name,
        settings: integration.config,
      };

      // Cache the config
      this.cache.set(integrationId, config);

      return config;
    } catch (error) {
      console.error(
        `Error getting integration config for ${integrationId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Updates the configuration for an integration
   * @param integrationId The ID of the integration
   * @param config The updated configuration
   * @returns A promise that resolves when the update is complete
   */
  async updateConfig(
    integrationId: string,
    config: Partial<IntegrationConfig>,
  ): Promise<boolean> {
    try {
      // Convert settings to JSON string if provided
      const updates: Record<string, unknown> = {};

      if (config.enabled !== undefined) {
        updates.isEnabled = config.enabled;
      }

      if (config.name !== undefined) {
        updates.name = config.name;
      }

      if (config.description !== undefined) {
        updates.description = config.description;
      }

      if (config.apiKey !== undefined) {
        updates.apiKey = config.apiKey;
      }

      if (config.apiEndpoint !== undefined) {
        updates.apiEndpoint = config.apiEndpoint;
      }

      if (config.settings !== undefined) {
        updates.config = safeStringifyJson(config.settings);
      }

      // Update in database
      await this.convex.mutation("rules.updateIntegration", {
        id: integrationId,
        ...updates,
      });

      // Update cache if it exists
      if (this.cache.has(integrationId)) {
        const existingConfig = this.cache.get(integrationId)!;
        this.cache.set(integrationId, {
          ...existingConfig,
          ...config,
          // Merge settings instead of replacing them
          settings: config.settings
            ? { ...existingConfig.settings, ...config.settings }
            : existingConfig.settings,
        });
      }

      return true;
    } catch (error) {
      console.error(
        `Error updating integration config for ${integrationId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Clears the cache for an integration
   * @param integrationId The ID of the integration
   */
  clearCache(integrationId: string): void {
    this.cache.delete(integrationId);
  }

  /**
   * Clears the entire cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Gets specific settings for an integration
   * @param integrationId The ID of the integration
   * @param key The settings key
   * @param defaultValue The default value to return if the key is not found
   * @returns A promise that resolves to the settings value
   */
  async getSetting<T>(
    integrationId: string,
    key: string,
    defaultValue: T,
  ): Promise<T> {
    const config = await this.getConfig(integrationId);
    if (!config) {
      return defaultValue;
    }

    return (config.settings[key] as T) ?? defaultValue;
  }

  /**
   * Sets a specific setting for an integration
   * @param integrationId The ID of the integration
   * @param key The settings key
   * @param value The settings value
   * @returns A promise that resolves when the update is complete
   */
  async setSetting<T>(
    integrationId: string,
    key: string,
    value: T,
  ): Promise<boolean> {
    const config = await this.getConfig(integrationId);
    if (!config) {
      return false;
    }

    const updatedSettings = { ...config.settings, [key]: value };
    return await this.updateConfig(integrationId, {
      settings: updatedSettings,
    });
  }
}
