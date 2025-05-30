import * as fs from "fs";
import * as path from "path";

// Import Config from payload
import type { Config } from "payload";
// Import the generator function
import { generatePayloadCollection } from "./generators/payload"; // Assuming this is exported from here
// Import parser and generator functions (adjust paths as needed after refactoring)
import { parseConvexSchema } from "./utilities/schema-parser"; // Assuming parseConvexSchema is exported from here

// We might need CollectionConfig later if we type the return value of the generator more strictly
// import type { CollectionConfig } from 'payload/types';

// Define Plugin Options
export interface ConvexSyncPluginOptions {
  /**
   * Path to the Convex schema file (e.g., '../convex/schema.ts').
   * Resolved relative to the Payload config file.
   */
  convexSchemaPath: string;

  /**
   * Optional: Path to output generated files for debugging.
   * If provided, the plugin will write the generated CollectionConfig objects as TS files.
   * Resolved relative to the Payload config file.
   */
  outputDir?: string; // Optional output for debugging

  // TODO: Add options to specify which tables are globals, or naming conventions?
}

export const convexSync =
  (pluginOptions: ConvexSyncPluginOptions) =>
  (incomingConfig: Config): Config => {
    const { convexSchemaPath, outputDir } = pluginOptions;

    // --- 1. Resolve Paths ---
    // Assume payload.config.ts is the entry point, paths are relative to it.
    // Using process.cwd() as the base for resolving relative paths.
    const configDir = process.cwd();
    const resolvedSchemaPath = path.resolve(configDir, convexSchemaPath);
    let resolvedOutputDir: string | undefined = undefined;
    if (outputDir) {
      resolvedOutputDir = path.resolve(configDir, outputDir);
      // Ensure debug output dir exists
      if (!fs.existsSync(resolvedOutputDir)) {
        try {
          fs.mkdirSync(resolvedOutputDir, { recursive: true });
          console.log(
            `[convex-sync] Created debug output directory: ${resolvedOutputDir}`,
          );
        } catch (error) {
          console.error(
            `[convex-sync] Error creating debug output directory ${resolvedOutputDir}:`,
            error,
          );
          // Don't halt config build for debug dir error, just warn.
          resolvedOutputDir = undefined;
        }
      }
    }

    console.log(
      `[convex-sync] Resolved Convex schema path: ${resolvedSchemaPath}`,
    );

    // --- 2. Validate Schema Path ---
    if (!fs.existsSync(resolvedSchemaPath)) {
      console.error(
        `[convex-sync] Error: Convex schema file not found at ${resolvedSchemaPath}. Skipping collection generation.`,
      );
      // Return config unmodified if schema is missing
      return incomingConfig;
    }

    // --- 3. Initialize Collections Array ---
    const config = { ...incomingConfig }; // Shallow clone to avoid modifying the original object directly yet
    if (!config.collections) {
      config.collections = [];
    }
    // TODO: Initialize globals array when needed
    // if (!config.globals) {
    //   config.globals = [];
    // }

    // --- 4. Parse Convex Schema ---
    let parsedTables = [];
    try {
      // NOTE: Assumes parseConvexSchema is refactored to RETURN data
      // and accept the path as an argument.
      parsedTables = parseConvexSchema(resolvedSchemaPath);
      console.log(
        `[convex-sync] Parsed ${parsedTables.length} table definitions from Convex schema.`,
      );
    } catch (error) {
      console.error(
        `[convex-sync] Error parsing Convex schema at ${resolvedSchemaPath}:`,
        error,
      );
      console.error(
        `[convex-sync] Skipping collection generation due to parsing error.`,
      );
      return config; // Return potentially partially modified config (e.g., initialized arrays)
    }

    // --- 5. Generate and Inject Collections/Globals ---
    parsedTables.forEach((tableData) => {
      // TODO: Logic to differentiate Collections vs Globals
      const isCollection = true; // Assume collection for now

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (isCollection) {
        try {
          console.log(
            `[convex-sync] Generating Payload collection for Convex table: ${tableData.name}`,
          );
          // Remove explicit CollectionConfig type to allow assignment from the generator function (which returns 'any' for now)
          const collectionConfig = generatePayloadCollection(tableData);

          // Inject into config
          config.collections?.push(collectionConfig);

          // Optional: Write debug file
          // if (resolvedOutputDir) {
          //     // Need the formatter function if we do this
          //     // const tsContent = formatConfigToTypeScript(collectionConfig);
          //     // const filePath = path.join(resolvedOutputDir, `${collectionConfig.slug}.ts`);
          //     // fs.writeFileSync(filePath, tsContent, 'utf-8');
          // }
        } catch (error) {
          console.error(
            `[convex-sync] Error generating collection config for table '${tableData.name}':`,
            error,
          );
        }
      } else {
        // TODO: Handle Globals generation
        // console.log(`[convex-sync] Generating Payload global for Convex table: ${tableData.name}`);
        // const globalConfig = generatePayloadGlobal(tableData); // Hypothetical function
        // config.globals.push(globalConfig);
      }
    });

    console.log(
      `[convex-sync] Injected ${config.collections.length - (incomingConfig.collections?.length ?? 0)} collections from Convex schema.`,
    );

    // --- 6. Return Modified Config ---
    return config;
  };
