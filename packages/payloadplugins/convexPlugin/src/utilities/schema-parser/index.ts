import type {
  CallExpression,
  ObjectLiteralExpression} from "ts-morph";
import {
  Identifier,
  Node,
  Project,
  PropertyAssignment,
  SyntaxKind,
  ts,
} from "ts-morph";
// Keep only necessary type imports
import type {
  ParsedField,
  ParsedIndex,
  ParsedTable,
  ParsedValidatorResult,
} from "./types";

// --- Simplified Parsing Functions ---

// Simplified: Removed reusedValidators map and cycle detection
const parseValidatorNode = (node: Node): ParsedValidatorResult => {
  let isOptional = false;
  let currentNode: Node | undefined = node; // Allow undefined during unwrapping

  // Handle v.optional
  if (Node.isCallExpression(currentNode)) {
    const expr = currentNode.getExpression();
    if (
      Node.isPropertyAccessExpression(expr) &&
      expr.getName() === "optional"
    ) {
      isOptional = true;
      // Use nullish coalescing and ensure currentNode remains defined or becomes undefined
      currentNode = currentNode.getArguments()[0] ?? undefined;
    }
  }

  // If unwrapping resulted in undefined, return unknown
  if (!currentNode) {
    console.warn(
      "[Parser] Node became undefined after optional unwrapping, possibly invalid v.optional() usage.",
    );
    return { type: "unknown", isOptional };
  }

  // --- Rest of the function operates on a defined currentNode ---
  if (Node.isCallExpression(currentNode)) {
    const callExpr = currentNode;
    const expression = callExpr.getExpression();

    if (Node.isPropertyAccessExpression(expression)) {
      const base = expression.getExpression();
      const propertyName = expression.getName();

      if (Node.isIdentifier(base) && base.getText() === "v") {
        switch (propertyName) {
          case "string":
            return { type: "string", isOptional };
          case "number":
            return { type: "number", isOptional };
          case "boolean":
            return { type: "boolean", isOptional };
          case "null":
            return { type: "null", isOptional };
          case "any":
            return { type: "any", isOptional };
          case "id": {
            const args = callExpr.getArguments();
            const tableName = Node.isStringLiteral(args[0])
              ? args[0].getLiteralText()
              : undefined;
            return { type: "id", isOptional, tableName };
          }
          case "literal": {
            const args = callExpr.getArguments();
            const arg = args[0]; // Check arg exists before accessing
            if (arg) {
              let literalValue: any = undefined;
              if (Node.isStringLiteral(arg))
                literalValue = arg.getLiteralText();
              else if (Node.isNumericLiteral(arg))
                literalValue = parseFloat(arg.getLiteralText());
              else if (arg.getKind() === SyntaxKind.TrueKeyword)
                literalValue = true;
              else if (arg.getKind() === SyntaxKind.FalseKeyword)
                literalValue = false;
              else if (arg.getKind() === SyntaxKind.NullKeyword)
                literalValue = null;
              return { type: "literal", isOptional, value: literalValue };
            }
            console.warn("[Parser] v.literal() called with no argument.");
            return { type: "literal", isOptional };
          }
          case "union": {
            const args = callExpr.getArguments();
            // Simplified: Don't recurse into reused validators for now
            const unionOptions = args.map((arg) => parseValidatorNode(arg));
            return { type: "union", isOptional, options: unionOptions };
          }
          case "array": {
            const args = callExpr.getArguments();
            const elementNode = args[0]; // Check exists before passing
            if (elementNode) {
              const elementValidator = parseValidatorNode(elementNode);
              return {
                type: "array",
                isOptional,
                elementType: elementValidator,
              };
            }
            console.warn("[Parser] v.array() called with no argument.");
            return { type: "array", isOptional };
          }
          case "object": {
            const args = callExpr.getArguments();
            if (args.length === 1 && Node.isObjectLiteralExpression(args[0])) {
              const objectLiteral = args[0];
              const fieldsMap = new Map<string, ParsedValidatorResult>();
              objectLiteral.getProperties().forEach((prop) => {
                if (Node.isPropertyAssignment(prop)) {
                  const fieldName = prop.getName();
                  const initializer = prop.getInitializer();
                  if (initializer) {
                    // Simplified: Don't recurse into reused validators
                    fieldsMap.set(fieldName, parseValidatorNode(initializer));
                  }
                }
              });
              return { type: "object", isOptional, fields: fieldsMap };
            }
            return { type: "object", isOptional, fields: new Map() };
          }
        }
      }
    }
  }

  // Simplified: Treat identifiers as unknown for now
  if (Node.isIdentifier(currentNode)) {
    return {
      type: "unknown",
      isOptional,
      error: `Identifier reference not handled: ${currentNode.getText()}`,
    };
  }

  // Fallback for unhandled nodes
  console.warn(
    `[Parser] Unhandled validator node type: ${currentNode.getKindName()}`,
  );
  return { type: "unknown", isOptional };
};

// Simplified: Removed reusedValidators parameter
const parseTableFields = (
  objectLiteral: ObjectLiteralExpression,
): Map<string, ParsedField> => {
  const fieldsMap = new Map<string, ParsedField>();
  objectLiteral.getProperties().forEach((property) => {
    if (Node.isPropertyAssignment(property)) {
      const fieldName = property.getName();
      const initializer = property.getInitializer();
      if (initializer) {
        const parsedValidator = parseValidatorNode(initializer);
        fieldsMap.set(fieldName, {
          name: fieldName,
          // validatorNode: initializer, // Exclude node
          parsedValidator: parsedValidator,
        });
      } else {
        fieldsMap.set(fieldName, {
          name: fieldName,
          parsedValidator: {
            type: "unknown",
            isOptional: false,
            error: "No initializer",
          },
        });
      }
    }
  });
  return fieldsMap;
};

const parseIndexDefinition = (callExpr: CallExpression): ParsedIndex | null => {
  const args = callExpr.getArguments();
  if (
    args.length >= 2 &&
    Node.isStringLiteral(args[0]) &&
    Node.isArrayLiteralExpression(args[1])
  ) {
    const indexName = args[0].getLiteralText();
    const indexFields = args[1]
      .getElements()
      .filter(Node.isStringLiteral)
      .map((el) => el.getLiteralText());
    if (indexFields.length > 0) {
      return { name: indexName, fields: indexFields };
    }
  }
  return null;
};

// Simplified: No sourceFile or reusedValidators needed here anymore
const parseTableDefinition = (startNode: Node): ParsedTable | null => {
  let defineTableCall: CallExpression | undefined;
  let currentNode: Node | undefined = startNode;

  // Find base defineTable call
  while (currentNode) {
    if (Node.isCallExpression(currentNode)) {
      const expr = currentNode.getExpression();
      if (Node.isIdentifier(expr) && expr.getText() === "defineTable") {
        defineTableCall = currentNode;
        break;
      }
      if (
        Node.isPropertyAccessExpression(expr) &&
        ["index", "searchIndex", "withoutSystemFields"].includes(expr.getName())
      ) {
        currentNode = expr.getExpression();
        continue;
      }
    }
    break;
  }
  if (!defineTableCall) return null;

  // Parse fields
  const args = defineTableCall.getArguments();
  let fieldsMap = new Map<string, ParsedField>();
  if (args.length > 0 && Node.isObjectLiteralExpression(args[0])) {
    fieldsMap = parseTableFields(args[0]);
  }

  // Parse indexes
  const indexes: ParsedIndex[] = [];
  currentNode = startNode;
  while (currentNode && currentNode !== defineTableCall) {
    if (Node.isCallExpression(currentNode)) {
      const expr = currentNode.getExpression();
      if (Node.isPropertyAccessExpression(expr) && expr.getName() === "index") {
        const parsedIndex = parseIndexDefinition(currentNode);
        if (parsedIndex) indexes.push(parsedIndex);
      }
      if (Node.isPropertyAccessExpression(expr)) {
        currentNode = expr.getExpression();
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return { name: "", fields: Array.from(fieldsMap.values()), indexes };
};

// --- Simplified Main Export ---
export const parseConvexSchema = (schemaPath: string): ParsedTable[] => {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(schemaPath);

  // Find defineSchema call
  let defineSchemaCall: CallExpression | undefined;
  sourceFile.forEachDescendant((node) => {
    if (
      Node.isCallExpression(node) &&
      node.getExpression().getText() === "defineSchema"
    ) {
      defineSchemaCall = node;
    }
  });
  if (!defineSchemaCall)
    throw new Error(`Could not find defineSchema call in ${schemaPath}`);

  const schemaArgument = defineSchemaCall.getArguments()[0];
  if (!Node.isObjectLiteralExpression(schemaArgument))
    throw new Error("defineSchema arg is not object literal.");

  const parsedTables: ParsedTable[] = [];

  // Iterate through tables in defineSchema
  schemaArgument.getProperties().forEach((property) => {
    if (Node.isPropertyAssignment(property)) {
      const tableName = property.getName();
      const initializer = property.getInitializer();

      // Simplified: Assume direct defineTable or chained call, ignore variable assignments for now
      if (initializer) {
        const parsedTable = parseTableDefinition(initializer);
        if (parsedTable) {
          parsedTable.name = tableName; // Set the correct name
          parsedTables.push(parsedTable);
        } else {
          console.warn(
            `[Parser] Failed to parse table definition for '${tableName}'.`,
          );
        }
      } else {
        console.warn(`[Parser] No initializer found for table '${tableName}'.`);
      }
    }
  });

  console.log(
    `[Parser] Completed schema parsing. Found ${parsedTables.length} tables.`,
  );
  return parsedTables; // Return the array of parsed data
};
