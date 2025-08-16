import * as fs from "node:fs";
import * as path from "node:path";

import type {
  ConnectionDefinition,
  EnhancedIntegrationRegistry,
  IntegrationNodeDefinition,
  IntegrationRegistry,
  NodeDiscoveryError,
  NodeDiscoveryResult,
  NodeLoader,
  NodeRegistryEntry,
  NodeType,
} from "./types.js";

// Node loader implementation
class DefaultNodeLoader implements NodeLoader {
  async scanDirectory(basePath: string): Promise<NodeDiscoveryResult> {
    const startTime = Date.now();
    const discovered: NodeRegistryEntry[] = [];
    const errors: NodeDiscoveryError[] = [];
    let totalScanned = 0;

    try {
      await this.recursiveScan(basePath, discovered, errors, totalScanned);
    } catch (error) {
      errors.push({
        path: basePath,
        error: error instanceof Error ? error.message : "Unknown error",
        severity: "error",
      });
    }

    return {
      discovered,
      errors,
      totalScanned,
      duration: Date.now() - startTime,
    };
  }

  private async recursiveScan(
    dirPath: string,
    discovered: NodeRegistryEntry[],
    errors: NodeDiscoveryError[],
    totalScanned: number,
  ): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      totalScanned++;

      if (entry.isDirectory()) {
        await this.recursiveScan(fullPath, discovered, errors, totalScanned);
      } else if (entry.name === "definition.ts" || entry.name === "index.ts") {
        try {
          const definition = await this.loadNodeDefinition(fullPath);
          if (this.validateNode(definition)) {
            discovered.push({
              definition,
              connections: [],
              isEnabled: true,
              installedAt: new Date(),
            });
          }
        } catch (error) {
          errors.push({
            path: fullPath,
            error: error instanceof Error ? error.message : "Failed to load",
            severity: "error",
          });
        }
      }
    }
  }

  async loadNodeDefinition(
    filePath: string,
  ): Promise<IntegrationNodeDefinition> {
    try {
      const module = await import(filePath);

      // Try different export names
      const definition =
        module.default ||
        module.nodeDefinition ||
        module.definition ||
        Object.values(module).find(
          (exp: any) => exp?.metadata?.id && exp?.processor?.execute,
        );

      if (!definition) {
        throw new Error("No valid node definition found in module");
      }

      return definition as IntegrationNodeDefinition;
    } catch (error) {
      throw new Error(`Failed to load node from ${filePath}: ${error}`);
    }
  }

  validateNode(definition: IntegrationNodeDefinition): boolean {
    try {
      // Basic metadata validation
      if (!definition.metadata?.id || !definition.metadata?.name) {
        return false;
      }

      // Schema validation
      if (!definition.configSchema?.input?.schema) {
        return false;
      }

      // Processor validation
      if (typeof definition.processor?.execute !== "function") {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}

export class IntegrationNodeRegistry implements EnhancedIntegrationRegistry {
  public nodes = new Map<string, NodeRegistryEntry>();
  private discoveryErrors: NodeDiscoveryError[] = [];
  private loader: NodeLoader;

  constructor(loader?: NodeLoader) {
    this.loader = loader || new DefaultNodeLoader();
  }

  getNode(id: string): NodeRegistryEntry | undefined {
    return this.nodes.get(id);
  }

  registerNode(
    definition: IntegrationNodeDefinition,
    connections?: ConnectionDefinition[],
  ): void {
    const entry: NodeRegistryEntry = {
      definition,
      connections: connections || [],
      isEnabled: true,
      installedAt: new Date(),
    };

    this.nodes.set(definition.metadata.id, entry);

    // Execute onInstall if provided
    if (definition.onInstall) {
      definition.onInstall().catch((error) => {
        console.error(
          `Failed to install node ${definition.metadata.id}:`,
          error,
        );
      });
    }
  }

  unregisterNode(id: string): void {
    const entry = this.nodes.get(id);
    if (entry) {
      // Execute onUninstall if provided
      if (entry.definition.onUninstall) {
        entry.definition.onUninstall().catch((error) => {
          console.error(`Failed to uninstall node ${id}:`, error);
        });
      }
      this.nodes.delete(id);
    }
  }

  listNodes(filter?: {
    type?: NodeType;
    category?: string;
  }): NodeRegistryEntry[] {
    const entries = Array.from(this.nodes.values());

    if (!filter) {
      return entries;
    }

    return entries.filter((entry) => {
      if (filter.type && entry.definition.metadata.type !== filter.type) {
        return false;
      }
      if (
        filter.category &&
        entry.definition.metadata.category !== filter.category
      ) {
        return false;
      }
      return true;
    });
  }

  // Utility methods
  getEnabledNodes(): NodeRegistryEntry[] {
    return Array.from(this.nodes.values()).filter((entry) => entry.isEnabled);
  }

  getNodesByType(type: NodeType): NodeRegistryEntry[] {
    return this.listNodes({ type });
  }

  getNodesByCategory(category: string): NodeRegistryEntry[] {
    return this.listNodes({ category });
  }

  enableNode(id: string): void {
    const entry = this.nodes.get(id);
    if (entry) {
      entry.isEnabled = true;
    }
  }

  disableNode(id: string): void {
    const entry = this.nodes.get(id);
    if (entry) {
      entry.isEnabled = false;
    }
  }

  // Get all available connections for external nodes
  getAvailableConnections(): ConnectionDefinition[] {
    const connections: ConnectionDefinition[] = [];

    Array.from(this.nodes.values()).forEach((entry) => {
      if (entry.definition.metadata.type === "external" && entry.connections) {
        connections.push(...entry.connections);
      }
    });

    return connections;
  }

  // Enhanced registry methods for auto-discovery
  async discover(basePath: string): Promise<NodeDiscoveryResult> {
    const result = await this.loader.scanDirectory(basePath);
    this.discoveryErrors.push(...result.errors);
    return result;
  }

  async autoRegisterFromDirectory(basePath: string): Promise<void> {
    const result = await this.discover(basePath);

    for (const entry of result.discovered) {
      this.nodes.set(entry.definition.metadata.id, entry);

      // Execute onInstall hook if present
      if (entry.definition.onInstall) {
        try {
          await entry.definition.onInstall();
        } catch (error) {
          console.error(
            `Failed to run onInstall for ${entry.definition.metadata.id}:`,
            error,
          );
        }
      }
    }

    if (result.errors.length > 0) {
      console.warn(
        `Discovery completed with ${result.errors.length} errors. Use getDiscoveryErrors() for details.`,
      );
    }
  }

  getDiscoveryErrors(): NodeDiscoveryError[] {
    return [...this.discoveryErrors];
  }

  async reload(): Promise<void> {
    this.discoveryErrors = [];
    // In a real implementation, we'd re-scan the original directory
    // For now, this clears the registry
    this.nodes.clear();
  }

  // Validate node configuration
  async validateNodeSettings(
    nodeId: string,
    settings: unknown,
  ): Promise<boolean> {
    const entry = this.nodes.get(nodeId);
    if (!entry) {
      throw new Error(`Node ${nodeId} not found in registry`);
    }

    try {
      // Validate against schema
      entry.definition.configSchema.settings.schema.parse(settings);

      // Run custom validation if provided
      if (entry.definition.processor.validate) {
        return await entry.definition.processor.validate(settings);
      }

      return true;
    } catch (error) {
      console.error(`Validation failed for node ${nodeId}:`, error);
      return false;
    }
  }
}

// Global registry instance
export const globalNodeRegistry = new IntegrationNodeRegistry();

// Helper functions for easy registration
export function registerSystemNode(
  definition: IntegrationNodeDefinition,
): void {
  if (definition.metadata.type !== "system") {
    throw new Error("Node must be of type 'system'");
  }
  globalNodeRegistry.registerNode(definition);
}

export function registerExternalNode(
  definition: IntegrationNodeDefinition,
  connections: ConnectionDefinition[],
): void {
  if (definition.metadata.type !== "external") {
    throw new Error("Node must be of type 'external'");
  }
  globalNodeRegistry.registerNode(definition, connections);
}

// Auto-discovery helper for dynamic loading
export async function discoverAndRegisterNodes(
  basePath: string,
): Promise<NodeDiscoveryResult> {
  const result = await globalNodeRegistry.discover(basePath);

  // Auto-register discovered nodes
  for (const entry of result.discovered) {
    globalNodeRegistry.registerNode(entry.definition, entry.connections);
  }

  console.log(
    `Discovery completed: ${result.discovered.length} nodes found, ${result.errors.length} errors in ${result.duration}ms`,
  );

  return result;
}
