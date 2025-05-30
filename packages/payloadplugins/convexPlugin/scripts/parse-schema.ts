#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

import { Command } from "commander";
import { fileURLToPath } from "url";
// Update import path relative to the new location
import { parseConvexSchema } from "../src/utilities/schema-parser";

const program = new Command();

// Get the directory name using import.meta.url for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
  .name("parse-convex-schema")
  .description(
    "Parses a Convex schema.ts file and outputs a structured JSON representation.",
  )
  .requiredOption(
    "-i, --input <path>",
    "Path to the input Convex schema.ts file",
  )
  .requiredOption(
    "-o, --output <path>",
    "Path for the output parsed-schema.json file",
  )
  .action(async (options) => {
    // Determine workspace root based on script location
    const workspaceRoot = path.resolve(__dirname, "../../../../");

    // Resolve paths relative to the determined workspace root
    const inputPath = path.resolve(workspaceRoot, options.input);
    const outputPath = path.resolve(workspaceRoot, options.output);
    const outputDir = path.dirname(outputPath);

    console.log(`Workspace Root (calculated): ${workspaceRoot}`);
    console.log(`Input Schema: ${inputPath}`);
    console.log(`Output JSON:  ${outputPath}`);

    // Validate input path
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: Input schema file not found at ${inputPath}`);
      process.exit(1);
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      try {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
      } catch (error) {
        console.error(`Error creating output directory ${outputDir}:`, error);
        process.exit(1);
      }
    }

    // Run the parser
    try {
      parseConvexSchema(inputPath, outputPath);
      console.log("\nParsing completed successfully.");
    } catch (error) {
      console.error("\nError during schema parsing:", error);
      process.exit(1);
    }
  });

program.parse(process.argv);
