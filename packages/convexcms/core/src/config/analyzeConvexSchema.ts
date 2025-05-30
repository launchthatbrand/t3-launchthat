import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import * as prettier from "prettier";
import {
  CallExpression,
  Project,
  PropertyAccessExpression,
  PropertyAssignment,
  SourceFile,
  SyntaxKind,
} from "ts-morph";

import type {
  AdminCollectionConfig,
  AdminCollectionField,
  AdminConfig,
} from "./types";

// ----- Helper Functions -----
function simplifyConvexType(typeString: string): string {
  const match = typeString.match(/^v\.(\w+)/);
  if (match && match[1]) {
    const typeMap: Record<string, string> = {
      string: "string",
      number: "number",
      boolean: "boolean",
      id: "id",
      array: "array",
      object: "object",
      union: "union",
      literal: "literal",
      int64: "number",
    };
    return typeMap[match[1]] || "unknown";
  }
  return "unknown";
}

function toTitleCase(str: string): string {
  str = str.replace(/([A-Z])/g, " $1");
  str = str.replace(/[_-]/g, " ");
  return str
    .toLowerCase()
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function generateFieldsConfig(
  fields: Record<string, string>,
): Record<string, AdminCollectionField> {
  return Object.fromEntries(
    Object.entries(fields).map(([fieldName, fieldType]) => [
      fieldName,
      {
        label: toTitleCase(fieldName),
        type: fieldType,
      } as AdminCollectionField,
    ]),
  );
}

function generateConfig(
  tables: Record<string, Record<string, string>>,
): AdminConfig {
  return {
    collections: Object.fromEntries(
      Object.entries(tables).map(([tableName, fields]) => [
        tableName,
        {
          label: toTitleCase(tableName),
          pluralLabel: toTitleCase(tableName),
          fields: generateFieldsConfig(fields),
        } as AdminCollectionConfig,
      ]),
    ),
  };
}

function parseConvexSchema(
  sourceFile: SourceFile,
): Record<string, Record<string, string>> {
  const tables: Record<string, Record<string, string>> = {};
  const defaultExportSymbol = sourceFile.getDefaultExportSymbol();
  if (!defaultExportSymbol) {
    console.error("Could not find default export symbol in schema.ts");
    return tables;
  }

  const exportValueDeclaration = defaultExportSymbol.getValueDeclaration();
  if (!exportValueDeclaration) {
    console.error("Could not get value declaration for default export.");
    return tables;
  }

  const schemaDeclaration = exportValueDeclaration.asKind(
    SyntaxKind.CallExpression,
  );

  if (
    !schemaDeclaration ||
    schemaDeclaration.getExpression().getText() !== "defineSchema"
  ) {
    console.error("Default export is not a call expression to defineSchema");
    return tables;
  }

  const schemaObject = schemaDeclaration.getArguments()[0];
  if (
    !schemaObject ||
    !schemaObject.isKind(SyntaxKind.ObjectLiteralExpression)
  ) {
    console.error("defineSchema argument is not an object literal");
    return tables;
  }

  schemaObject.getProperties().forEach((property) => {
    if (property.isKind(SyntaxKind.PropertyAssignment)) {
      const tableName = property.getName();
      let tableInitializer = property.getInitializer();

      while (
        tableInitializer?.isKind(SyntaxKind.CallExpression) &&
        tableInitializer
          .getExpression()
          .isKind(SyntaxKind.PropertyAccessExpression)
      ) {
        const expressionText = tableInitializer.getExpression().getText();
        if (
          expressionText.endsWith(".index") ||
          expressionText.endsWith(".searchIndex")
        ) {
          tableInitializer = (
            tableInitializer.getExpression() as PropertyAccessExpression
          ).getExpression();
        } else {
          break;
        }
      }

      if (tableInitializer?.isKind(SyntaxKind.CallExpression)) {
        const defineTableCall = tableInitializer as CallExpression;
        const funcName = defineTableCall.getExpression().getText();

        if (funcName.endsWith("defineTable")) {
          const tableFieldsObject = defineTableCall.getArguments()[0];
          if (tableFieldsObject?.isKind(SyntaxKind.ObjectLiteralExpression)) {
            const fields: Record<string, string> = {};
            tableFieldsObject.getProperties().forEach((fieldProperty) => {
              if (fieldProperty.isKind(SyntaxKind.PropertyAssignment)) {
                const assignment = fieldProperty as PropertyAssignment;
                const fieldName = assignment.getName();
                const fieldTypeNode = assignment.getInitializer();
                const fieldType = fieldTypeNode?.getText() ?? "unknown";
                fields[fieldName] = simplifyConvexType(fieldType);
              }
            });
            tables[tableName] = fields;
          } else {
            console.warn(`Could not find fields object for table ${tableName}`);
          }
        } else {
        }
      } else {
      }
    }
  });
  return tables;
}

// Function to generate the content for importMap.ts
function generateImportMapContent(): string {
  const imports = `
// View Imports
import { DashboardView } from '@/packages/convexcms/next/src/components/views/DashboardView';
import { ListView } from '@/packages/convexcms/next/src/components/views/ListView';
import { EditView } from '@/packages/convexcms/next/src/components/views/EditView';
import { CreateView } from '@/packages/convexcms/next/src/components/views/CreateView';
import { NotFoundView } from '@/packages/convexcms/next/src/components/views/NotFoundView';
import { CollectionSettingsPage } from '@/packages/convexcms/next/src/components/views/CollectionSettingsPage';

// Field Imports
import { TextField } from '@/packages/convexcms/ui/src/fields/TextField';
import { CheckboxField } from '@/packages/convexcms/ui/src/fields/CheckboxField';
import { NumberField } from '@/packages/convexcms/ui/src/fields/NumberField';
import { UnknownField } from '@/packages/convexcms/ui/src/fields/UnknownField';
`;

  const mapObject = `
export const importMap = {
  views: {
    Dashboard: DashboardView,
    CollectionList: ListView,
    CollectionEdit: EditView,
    CollectionCreate: CreateView,
    CollectionSettings: CollectionSettingsPage,
    NotFound: NotFoundView,
  },
  fields: {
    string: TextField,
    boolean: CheckboxField,
    number: NumberField,
    id: UnknownField,
    array: UnknownField,
    object: UnknownField,
    union: UnknownField,
    literal: UnknownField,
    unknown: UnknownField,
  },
};
`;

  return `// This file is generated automatically. Do not edit.
/* eslint-disable */
${imports}
${mapObject}
`;
}

// ----- Formatting Function -----
async function formatCode(code: string): Promise<string> {
  try {
    const options = (await prettier.resolveConfig(process.cwd())) ?? {};
    options.parser = "typescript";
    return await prettier.format(code, options);
  } catch (error) {
    console.warn(
      "Prettier formatting failed, falling back to unformatted code:",
      error,
    );
    return code;
  }
}

// ----- Main Generation Logic -----
async function runGeneration() {
  console.log("Generating admin config & import map...");
  const project = new Project({});
  const schemaPath = join(process.cwd(), "apps/wsa/convex/schema.ts");
  console.log(`Reading schema file from: ${schemaPath}`);
  const schemaFile = project.addSourceFileAtPath(schemaPath);

  const tables = parseConvexSchema(schemaFile);
  if (Object.keys(tables).length === 0) {
    console.error("No tables parsed from schema. Aborting generation.");
    process.exit(1);
  }
  console.log(`Parsed tables: ${Object.keys(tables).join(", ")}`);

  const adminConfig = generateConfig(tables);

  const outputDir = join(
    process.cwd(),
    "packages/convexcms/next/src/.generated",
  );
  mkdirSync(outputDir, { recursive: true });
  console.log(`Ensured output directory exists: ${outputDir}`);

  // --- Generate config.ts ---
  const configOutputFile = join(outputDir, "config.ts");
  const configString = JSON.stringify(adminConfig, null, 2);
  const configTypeImportPath = "@/packages/convexcms/core/src/types";
  const configTsContent = `// This file is generated automatically. Do not edit.
/* eslint-disable */
import type { AdminConfig } from '${configTypeImportPath}';

export const config: AdminConfig = ${configString};
`;
  const formattedConfigTsContent = await formatCode(configTsContent);
  writeFileSync(configOutputFile, formattedConfigTsContent);
  console.log(`Admin config written to ${configOutputFile}`);

  // --- Generate importMap.ts ---
  const importMapOutputFile = join(outputDir, "importMap.ts");
  const importMapTsContent = generateImportMapContent();
  const formattedImportMapTsContent = await formatCode(importMapTsContent);
  writeFileSync(importMapOutputFile, formattedImportMapTsContent);
  console.log(`Admin import map written to ${importMapOutputFile}`);
}

runGeneration().catch((error) => {
  console.error("Error generating admin files:", error);
  process.exit(1);
});
