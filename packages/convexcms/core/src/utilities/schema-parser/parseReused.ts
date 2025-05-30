import {
  CallExpression,
  Node,
  SourceFile,
  SyntaxKind,
  VariableDeclarationKind,
} from "ts-morph";

/**
 * Finds variable declarations that look like reused validator objects (e.g., const name = v.object({...})).
 * TODO: Actually parse and store the structure.
 */
export const findReusedValidators = (
  sourceFile: SourceFile,
): Map<string, any> => {
  const reusedValidators = new Map<string, any>();
  const variableStatements = sourceFile.getVariableStatements();

  console.log("Found variable statements:");
  variableStatements.forEach((statement) => {
    if (statement.getDeclarationKind() === VariableDeclarationKind.Const) {
      statement.getDeclarations().forEach((declaration) => {
        const initializer = declaration.getInitializer();
        if (initializer && Node.isCallExpression(initializer)) {
          const expression = initializer.getExpression();
          if (expression.getText() === "v.object") {
            const validatorName = declaration.getName();
            console.log(
              `  - Found potential reused validator: ${validatorName}`,
            );
            // TODO: Parse the v.object structure here (from initializer arguments)
            //       and store it in reusedValidators map
            reusedValidators.set(validatorName, initializer); // Store initializer node for now
          }
        }
      });
    }
  });
  return reusedValidators;
};
