#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

import { Command } from "commander";
import { parseConvexSchema } from "../src/utilities/schema-parser"; // Adjust import path based on built structure if needed

const program = new Command();

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
    const inputPath = path.resolve(options.input);
    const outputPath = path.resolve(options.output);
    const outputDir = path.dirname(outputPath);

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
