import * as fs from "fs"; // Needed for JSON output later
import * as path from "path";

import {
  Node,
  ObjectLiteralExpression,
  Project,
  SourceFile,
  SyntaxKind,
  VariableDeclarationKind,
} from "ts-morph";
import type {
  ParsedField,
  ParsedIndex,
  ParsedTable,
  ParsedValidatorResult,
} from "./types";
import {
  findTableCallExpressions,
  parseFieldNodes,
  parseTableStructure,
} from "./parseStructure";

import { findReusedValidators } from "./parseReused";
import { parseValidatorNode } from "./parseValidators";

// Moved parseTableDefinition before its usage
const parseTableDefinition = (
  tableName: string,
  tableNode: Node, // The node for defineTable call arguments
  reusedValidators: Map<string, Node>,
): ParsedTable | null => {
  console.log(`Parsing definition for table: ${tableName}`);
  const fields: ParsedField[] = [];
  const indexes: ParsedIndex[] = [];
  let defineTableFieldsNode: Node | undefined;

  // TODO: Implement the logic from previous turns to find fields object and indexes
  // This will involve inspecting the defineTable call and its chained .index calls
  // For now, just a placeholder structure:
  if (Node.isCallExpression(tableNode)) {
    const args = tableNode.getArguments();
    if (args.length > 0 && Node.isObjectLiteralExpression(args[0])) {
      defineTableFieldsNode = args[0];
      args[0].getProperties().forEach((prop) => {
        if (Node.isPropertyAssignment(prop)) {
          const fieldName = prop.getName();
          const initializer = prop.getInitializer();
          if (initializer) {
            fields.push({
              name: fieldName,
              validatorNode: initializer, // Keep the node for now
              // parsedValidator will be populated later
            });
          } else {
            console.warn(
              `  Field '${fieldName}' in table '${tableName}' has no initializer.`,
            );
          }
        } else {
          console.warn(
            `  Unexpected property type in defineTable for ${tableName}: ${prop.getKindName()}`,
          );
        }
      });
    }
    // TODO: Find chained .index() calls and parse them into ParsedIndex
  }

  return {
    name: tableName,
    fields,
    indexes,
    defineTableFieldsNode,
  };
};

/**
 * Parses the convex/schema.ts file to extract table definitions,
 * including fields, types, relationships, and indexes.
 */
export const parseConvexSchema = (
  schemaFilePath: string,
  outputJsonPath?: string,
): ParsedTable[] => {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(schemaFilePath);

  console.log(`Parsing schema file: ${schemaFilePath}`);

  const parsedTables: ParsedTable[] = [];
  const reusedValidators = new Map<string, Node>();

  // 1. Find Reusable Validators (Top-level variables likely holding v.object etc.)
  sourceFile.getVariableDeclarations().forEach((decl) => {
    // Look for variable statements, especially const
    if (
      decl.getVariableStatement()?.getDeclarationKind() ===
      VariableDeclarationKind.Const
    ) {
      const initializer = decl.getInitializer();
      // Check if the initializer looks like a validator call (e.g., starts with v.)
      // This is a heuristic and might need refinement
      if (initializer && initializer.getText().trim().startsWith("v.")) {
        const name = decl.getName();
        console.log(`  Found potential reusable validator: ${name}`);
        reusedValidators.set(name, initializer);
      }
    }
  });

  // 2. Find the defineSchema call and its argument
  const defineSchemaCall = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((call) => call.getExpression().getText() === "defineSchema");

  if (!defineSchemaCall) {
    console.error("Could not find defineSchema call in the schema file.");
    return [];
  }

  const schemaObject = defineSchemaCall.getArguments()[0];
  if (!schemaObject || !Node.isObjectLiteralExpression(schemaObject)) {
    console.error("defineSchema argument is not an object literal.");
    return [];
  }

  // 3. Iterate through tables defined in the schema object
  schemaObject.getProperties().forEach((property) => {
    if (Node.isPropertyAssignment(property)) {
      const tableName = property.getName();
      const initializer = property.getInitializer(); // This should be the defineTable(...) call expression

      if (
        initializer &&
        Node.isCallExpression(initializer) &&
        initializer.getExpression().getText() === "defineTable"
      ) {
        const parsedTable = parseTableDefinition(
          tableName,
          initializer,
          reusedValidators,
        );
        if (parsedTable) {
          parsedTables.push(parsedTable);
        }
      } else {
        console.warn(
          `Property '${tableName}' in defineSchema is not a defineTable call.`,
        );
      }
    }
  });

  // 4. Populate Parsed Validators for each field in each table
  parsedTables.forEach((table) => {
    console.log(`  Populating validators for table: ${table.name}`);
    table.fields.forEach((field) => {
      console.log(`    Parsing validator for field: ${field.name}`);
      // Pass the collected reused validators map
      field.parsedValidator = parseValidatorNode(
        field.validatorNode,
        reusedValidators,
        new Set<string>(),
      );
      // We don't need the raw node anymore for the generator, potentially remove later before JSON stringify
    });
  });

  // 5. Serialize to JSON (Intermediate Step)
  if (outputJsonPath) {
    console.log(`Serializing parsed schema to: ${outputJsonPath}`);
    try {
      // Create a deep copy to avoid modifying the original data structure
      const serializableTables = JSON.parse(JSON.stringify(parsedTables));

      // Clean up non-serializable parts (ts-morph Nodes)
      serializableTables.forEach((table: any) => {
        delete table.defineTableFieldsNode; // Remove raw node reference
        table.fields.forEach((field: any) => {
          // Keep parsedValidator, but remove the raw validatorNode
          delete field.validatorNode;
          // If parsedValidator exists, maybe simplify it further if needed
          // (e.g., remove deeply nested nodes if they exist, though parseValidatorNode doesn't store them directly)
        });
      });

      const jsonString = JSON.stringify(serializableTables, null, 2); // Pretty print
      fs.writeFileSync(outputJsonPath, jsonString, "utf8");
      console.log(`  Successfully wrote parsed schema to ${outputJsonPath}`);
    } catch (error) {
      console.error(`  Error writing parsed schema to JSON file: ${error}`);
    }
  }

  console.log("Schema parsing complete.");
  return parsedTables;
};
