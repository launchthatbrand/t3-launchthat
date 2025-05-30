import { CallExpression, Node, SyntaxKind } from "ts-morph";

import type { ParsedValidatorResult } from "./types";

/**
 * Recursively parses a ts-morph Node representing a Convex validator call (v.*)
 * into a structured ParsedValidatorResult object.
 */
export const parseValidatorNode = (
  node: Node,
  reusedValidators: Map<string, Node>, // Map of identifier name to its defining Node
  visitedIdentifiers: Set<string>, // Track visited identifiers to prevent cycles
): ParsedValidatorResult => {
  console.log(
    `  -> Parsing validator node: ${node.getText().substring(0, 50)}... (${node.getKindName()})`,
    visitedIdentifiers.size > 0
      ? `(Visited: ${Array.from(visitedIdentifiers).join(", ")})`
      : "",
  );

  let isOptional = false;
  let currentNode = node;

  // Check for v.optional wrapper first
  if (Node.isCallExpression(currentNode)) {
    const expression = currentNode.getExpression();
    if (
      Node.isPropertyAccessExpression(expression) &&
      expression.getName() === "optional"
    ) {
      isOptional = true;
      const args = currentNode.getArguments();
      if (args.length === 1) {
        currentNode = args[0]; // Unwrap to the inner validator
        console.log(
          `    - Unwrapped optional, parsing inner: ${currentNode.getText().substring(0, 50)}`,
        );
      } else {
        console.warn(
          "    - v.optional() called with incorrect number of arguments.",
        );
        return { type: "unknown", isOptional: true };
      }
    }
  }

  // Now parse the (potentially unwrapped) validator node
  if (Node.isCallExpression(currentNode)) {
    const callExpr = currentNode as CallExpression;
    const expression = callExpr.getExpression();

    if (Node.isPropertyAccessExpression(expression)) {
      const base = expression.getExpression();
      const propertyName = expression.getName();

      if (Node.isIdentifier(base) && base.getText() === "v") {
        // Handle simple types like v.string(), v.number(), etc.
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
          // TODO: Add bigint, bytes, etc. if needed

          // Handle v.id("tableName")
          case "id": {
            const args = callExpr.getArguments();
            if (args.length === 1 && Node.isStringLiteral(args[0])) {
              const tableName = args[0].getLiteralText();
              return { type: "id", isOptional, tableName };
            } else {
              console.warn(
                "    - v.id() called without a single string literal argument.",
              );
              return { type: "id", isOptional }; // Return basic type even if arg parsing fails
            }
          }

          // Handle v.literal(value)
          case "literal": {
            const args = callExpr.getArguments();
            if (args.length === 1) {
              const arg = args[0];
              let literalValue: ParsedValidatorResult["value"] = undefined;
              if (Node.isStringLiteral(arg))
                literalValue = arg.getLiteralText();
              else if (Node.isNumericLiteral(arg))
                literalValue = parseFloat(arg.getLiteralText()); // Or parseInt
              else if (arg.getKind() === SyntaxKind.TrueKeyword)
                literalValue = true;
              else if (arg.getKind() === SyntaxKind.FalseKeyword)
                literalValue = false;
              else if (arg.getKind() === SyntaxKind.NullKeyword)
                literalValue = null;
              // TODO: Add bigint if needed
              else {
                console.warn(
                  `    - v.literal() called with unhandled argument type: ${arg.getKindName()}`,
                );
              }
              return { type: "literal", isOptional, value: literalValue };
            } else {
              console.warn(
                "    - v.literal() called without a single argument.",
              );
              return { type: "literal", isOptional };
            }
          }

          // Handle v.union(validator1, validator2, ...)
          case "union": {
            const args = callExpr.getArguments();
            const unionOptions = args.map((arg) =>
              parseValidatorNode(arg, reusedValidators, visitedIdentifiers),
            );
            return { type: "union", isOptional, options: unionOptions };
          }

          // Handle v.array(elementValidator)
          case "array": {
            const args = callExpr.getArguments();
            if (args.length === 1) {
              const elementValidator = parseValidatorNode(
                args[0],
                reusedValidators,
                visitedIdentifiers,
              );
              return {
                type: "array",
                isOptional,
                elementType: elementValidator,
              };
            } else {
              console.warn(
                "    - v.array() called without exactly one argument.",
              );
              return { type: "array", isOptional }; // Return basic type even if arg parsing fails
            }
          }

          // Handle v.object({ field: validator, ... })
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
                    fieldsMap.set(
                      fieldName,
                      parseValidatorNode(
                        initializer,
                        reusedValidators,
                        visitedIdentifiers,
                      ),
                    );
                  } else {
                    console.warn(
                      `    - v.object() property '${fieldName}' has no initializer.`,
                    );
                    fieldsMap.set(fieldName, {
                      type: "unknown",
                      isOptional: false,
                    });
                  }
                } else {
                  console.warn(
                    `    - v.object() encountered non-PropertyAssignment node: ${prop.getKindName()}`,
                  );
                }
              });

              return { type: "object", isOptional, fields: fieldsMap };
            } else {
              console.warn(
                "    - v.object() called without a single object literal argument.",
              );
              return { type: "object", isOptional, fields: new Map() }; // Return basic type even if arg parsing fails
            }
          }

          // TODO: Handle v.float64? v.bytes? etc.

          default:
            console.warn(`    - Unhandled v property access: ${propertyName}`);
            break;
        }
      }
    }
  }

  // Handle references to reused validators (identifiers)
  if (Node.isIdentifier(currentNode)) {
    const identifierName = currentNode.getText();
    console.log(
      `    - Encountered identifier: ${identifierName}. Checking reusedValidators.`,
    );

    // Cycle detection
    if (visitedIdentifiers.has(identifierName)) {
      console.warn(
        `      - Circular reference detected for identifier: ${identifierName}. Aborting parse for this branch.`,
      );
      return {
        type: "unknown",
        isOptional,
        error: `Circular reference to ${identifierName}`,
      };
    }

    if (reusedValidators.has(identifierName)) {
      const validatorDefinitionNode = reusedValidators.get(identifierName);
      if (validatorDefinitionNode) {
        console.log(
          `      - Found in reusedValidators. Parsing definition node: ${validatorDefinitionNode.getText().substring(0, 50)}...`,
        );
        // Add current identifier to the visited set for the recursive call
        const newVisited = new Set(visitedIdentifiers);
        newVisited.add(identifierName);
        // Parse the actual definition node
        const parsedResult = parseValidatorNode(
          validatorDefinitionNode,
          reusedValidators,
          newVisited,
        );
        // Apply the isOptional flag from the original context (e.g., v.optional(reusedSchema))
        return { ...parsedResult, isOptional };
      } else {
        console.warn(
          `      - Identifier ${identifierName} found in map but its node is undefined.`,
        );
        return {
          type: "unknown",
          isOptional,
          error: `Undefined node for ${identifierName}`,
        };
      }
    } else {
      console.warn(
        `      - Identifier ${identifierName} not found in reusedValidators map. Treating as 'unknown'. It might be defined outside the schema file scope. `,
      );
      return {
        type: "unknown",
        isOptional,
        error: `Unknown identifier ${identifierName}`,
      };
    }
  }

  // Placeholder for unknown/unhandled structures
  console.warn(`    - Unhandled node type: ${currentNode.getKindName()}`);
  return {
    type: "unknown",
    isOptional,
  };
};
