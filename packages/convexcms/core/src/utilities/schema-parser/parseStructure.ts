import {
  ArrayLiteralExpression,
  CallExpression,
  Node,
  ObjectLiteralExpression,
  Project,
  PropertyAccessExpression,
  SourceFile,
  SyntaxKind,
  VariableDeclarationKind,
} from "ts-morph";
import type { ParsedField, ParsedIndex, ParsedTable } from "./types";

/**
 * Finds variable declarations that look like reused validator objects (e.g., const name = v.object({...})).
 * TODO: Actually parse and store the structure.
 */
/* // Moved to parseReused.ts
export const findReusedValidators = (sourceFile: SourceFile): Map<string, any> => {
  // ... implementation ...
};
*/

/**
 * Finds the defineSchema call and extracts the raw call expressions for each table definition.
 */
export const findTableCallExpressions = (
  sourceFile: SourceFile,
): Map<string, CallExpression> => {
  const tableCallExpressions = new Map<string, CallExpression>();
  console.log("\nLooking for defineSchema call...");
  const defineSchemaCall = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((call) => {
      const expression = call.getExpression();
      return (
        Node.isIdentifier(expression) && expression.getText() === "defineSchema"
      );
    });

  if (defineSchemaCall) {
    console.log("Found defineSchema call.");
    const schemaObject = defineSchemaCall.getArguments()[0];
    if (schemaObject && Node.isObjectLiteralExpression(schemaObject)) {
      console.log("Extracting table definitions:");
      schemaObject.getProperties().forEach((property) => {
        if (Node.isPropertyAssignment(property)) {
          const tableName = property.getName();
          const initializer = property.getInitializer();
          if (initializer && Node.isCallExpression(initializer)) {
            tableCallExpressions.set(tableName, initializer);
            console.log(`  - Found table definition for: ${tableName}`);
          } else {
            console.warn(
              `  - Property ${tableName} initializer is not a CallExpression.`,
            );
          }
        }
      });
    } else {
      console.error(
        "Argument to defineSchema is not an ObjectLiteralExpression.",
      );
    }
  } else {
    console.error("Could not find defineSchema call.");
  }
  return tableCallExpressions;
};

/**
 * Parses the chained call expressions (defineTable(...).index(...))
 * to extract indexes and identify the core fields object node.
 */
export const parseTableStructure = (
  tableName: string,
  tableCallExpr: CallExpression,
): Omit<ParsedTable, "fields"> & { defineTableFieldsNode?: Node } => {
  const tableInfo: Omit<ParsedTable, "fields"> & {
    defineTableFieldsNode?: Node;
  } = {
    name: tableName,
    indexes: [],
  };

  let currentExpr: Node | undefined = tableCallExpr;
  let defineTableFieldsNode: Node | undefined;

  while (currentExpr && Node.isCallExpression(currentExpr)) {
    const expression = currentExpr.getExpression();
    if (Node.isPropertyAccessExpression(expression)) {
      const methodName = expression.getName();
      const innerExpression = expression.getExpression();
      if (methodName === "index") {
        const args = currentExpr.getArguments();
        if (
          args.length === 2 &&
          Node.isStringLiteral(args[0]) &&
          Node.isArrayLiteralExpression(args[1])
        ) {
          const indexName = args[0].getLiteralText();
          const indexFields = (args[1] as ArrayLiteralExpression)
            .getElements()
            .map((el) =>
              Node.isStringLiteral(el) ? el.getLiteralText() : null,
            )
            .filter((field) => field !== null) as string[];
          tableInfo.indexes.push({ name: indexName, fields: indexFields });
          console.log(
            `  - Extracted index '${indexName}' for table '${tableName}' with fields: [${indexFields.join(", ")}]`,
          );
        } else {
          console.warn(
            `  - Could not parse arguments for .index() call on table '${tableName}'`,
          );
        }
      } else {
        console.warn(
          `  - Found unexpected chained method '${methodName}' on table '${tableName}'`,
        );
      }
      currentExpr = innerExpression;
    } else if (
      Node.isIdentifier(expression) &&
      expression.getText() === "defineTable"
    ) {
      defineTableFieldsNode = currentExpr.getArguments()[0];
      console.log(`  - Found base defineTable call for '${tableName}'`);
      break;
    } else {
      console.error(
        `  - Unexpected expression type in call chain for table '${tableName}': ${expression.getKindName()}`,
      );
      break;
    }
  }
  tableInfo.defineTableFieldsNode = defineTableFieldsNode;
  return tableInfo;
};

/**
 * Parses the fields object literal node from defineTable to extract field names and validator nodes.
 */
export const parseFieldNodes = (
  defineTableFieldsNode?: Node,
): ParsedField[] => {
  const fields: ParsedField[] = [];
  if (
    defineTableFieldsNode &&
    Node.isObjectLiteralExpression(defineTableFieldsNode)
  ) {
    defineTableFieldsNode.getProperties().forEach((property) => {
      if (Node.isPropertyAssignment(property)) {
        const fieldName = property.getName();
        const initializer = property.getInitializer();
        if (initializer) {
          fields.push({ name: fieldName, validatorNode: initializer });
          console.log(`    - Found field node: ${fieldName}`);
        } else {
          console.warn(`    - Field '${fieldName}' has no initializer.`);
        }
      } else {
        console.warn(
          `    - Found non-PropertyAssignment node in fields object: ${property.getKindName()}`,
        );
      }
    });
  } else if (defineTableFieldsNode) {
    console.error(
      `  - Expected ObjectLiteralExpression for fields, but got ${defineTableFieldsNode.getKindName()}`,
    );
  } else {
    console.error(`  - Missing defineTable arguments node for field parsing.`);
  }
  return fields;
};
