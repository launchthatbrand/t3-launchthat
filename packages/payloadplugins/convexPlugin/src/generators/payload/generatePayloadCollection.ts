// import type { CollectionConfig, Field } from 'payload/types'; // Remove direct Payload dependency

// Import necessary types from the parser

// Import official Payload types
import type { PayloadRequest } from "payload";

import type {
  ParsedTable,
  ParsedValidatorResult,
} from "../../utilities/schema-parser/types";

// Adjusted import path

// --- Define basic structures mimicking Payload Config ---
// (These can be refined later)
// type PayloadField = Record<string, any>; // Basic placeholder
// type PayloadCollectionConfig = Record<string, any>; // Basic placeholder

// Helper function to convert Convex validator type to Payload field type
const mapValidatorToPayloadField = (
  parsedValidator: ParsedValidatorResult,
  fieldName: string,
): any | null => {
  const fieldDefinition: any = {
    name: fieldName,
    required: !parsedValidator.isOptional,
    // Add index property if relevant? Payload handles DB indexes separately via CollectionConfig.indexes
  };

  if (parsedValidator.error) {
    console.error(
      `  [Generator] Error parsing validator for field '${fieldName}': ${parsedValidator.error}. Skipping field.`,
    );
    return null; // Skip fields with parsing errors
  }

  switch (parsedValidator.type) {
    case "string":
      fieldDefinition.type = "text";
      break;
    case "number":
      fieldDefinition.type = "number";
      // TODO: Handle float vs int? Convex doesn't differentiate strongly at schema level.
      break;
    case "boolean":
      fieldDefinition.type = "checkbox";
      fieldDefinition.defaultValue = false; // Sensible default
      break;
    case "null":
      // Typically indicates optionality, handled by isOptional. Don't generate a field.
      return null;
    case "any":
      fieldDefinition.type = "json"; // Map 'any' to Payload's 'json' type
      break;
    case "id":
      fieldDefinition.type = "relationship";
      if (parsedValidator.tableName) {
        fieldDefinition.relationTo = parsedValidator.tableName;
      } else {
        console.warn(
          `  [Generator] v.id() field '${fieldName}' missing target table name. Defaulting relationTo to 'users'.`,
        );
        fieldDefinition.relationTo = "users"; // Need a default or make it configurable
      }
      fieldDefinition.hasMany = false;
      break;
    case "literal":
      // Could map to select if we group common literals, but for now, treat as simple types
      if (typeof parsedValidator.value === "string")
        fieldDefinition.type = "text";
      else if (typeof parsedValidator.value === "number")
        fieldDefinition.type = "number";
      else if (typeof parsedValidator.value === "boolean")
        fieldDefinition.type = "checkbox";
      else fieldDefinition.type = "json"; // Fallback for other literal types
      fieldDefinition.defaultValue = parsedValidator.value;
      fieldDefinition.admin = { readOnly: true }; // Literals are typically constant
      break;
    case "union":
      // Check if it's a union of literals (common pattern for status fields)
      const isLiteralUnion = parsedValidator.options?.every(
        (opt) => opt.type === "literal",
      );
      if (
        isLiteralUnion &&
        parsedValidator.options &&
        parsedValidator.options.length > 0
      ) {
        fieldDefinition.type = "select";
        fieldDefinition.options = parsedValidator.options.map((opt) => ({
          label: String(opt.value), // Convert value to string for label
          value: opt.value,
        }));
        // Set default value if the first option is not null/undefined?
        if (
          parsedValidator.options[0].value !== null &&
          parsedValidator.options[0].value !== undefined
        ) {
          fieldDefinition.defaultValue = parsedValidator.options[0].value;
        }
      } else {
        // Complex unions are hard to map directly. Maybe use Blocks or JSON?
        console.warn(
          `  [Generator] Complex union for field '${fieldName}' cannot be directly mapped. Using JSON type as fallback.`,
        );
        fieldDefinition.type = "json";
      }
      break;
    case "array":
      if (parsedValidator.elementType) {
        // Recursively map the element type to a Payload field definition
        // Use a placeholder name like 'item' for the inner field
        const subField = mapValidatorToPayloadField(
          parsedValidator.elementType,
          "item", // TODO: Payload needs unique name for array fields, maybe use fieldName + 'Item'?
        );
        if (subField) {
          // If the sub-field is simple (text, number etc), use it directly
          // Payload array field needs a 'fields' array
          fieldDefinition.type = "array";
          fieldDefinition.fields = [subField]; // Put the mapped sub-field inside the array's fields
          // How to handle array of relationships?
          if (subField.type === "relationship") {
            // We need to adjust the relationship field itself for hasMany
            // This might be overly complex for a simple mapping
            console.warn(
              `  [Generator] Array of relationships for '${fieldName}' might require manual adjustment.`,
            );
            // Attempt to set hasMany on the inner relationship field
            subField.hasMany = true;
            // Also remove required from the inner field as it's controlled by the array's required prop
            delete subField.required;
            // Payload expects relationTo to be an array for hasMany: true
            if (typeof subField.relationTo === "string") {
              subField.relationTo = [subField.relationTo];
            }
          }
        } else {
          console.warn(
            `  [Generator] Could not map array element type for field '${fieldName}'. Using JSON.`,
          );
          fieldDefinition.type = "json";
        }
      } else {
        console.warn(
          `  [Generator] Array field '${fieldName}' missing element type. Using JSON.`,
        );
        fieldDefinition.type = "json";
      }
      break;
    case "object":
      if (parsedValidator.fields && parsedValidator.fields.size > 0) {
        fieldDefinition.type = "group";
        fieldDefinition.fields = Array.from(parsedValidator.fields.entries())
          .map(([key, val]) => mapValidatorToPayloadField(val, key))
          .filter((f): f is any => f !== null);
      } else {
        console.warn(
          `  [Generator] Object field '${fieldName}' has no fields defined. Using JSON.`,
        );
        fieldDefinition.type = "json";
      }
      break;
    case "unknown":
      console.warn(
        `  [Generator] Field '${fieldName}' has an unknown validator type. Skipping.`,
      );
      return null;
    default:
      console.warn(
        `  [Generator] Unhandled validator type '${parsedValidator.type}' for field '${fieldName}'. Skipping.`,
      );
      return null;
  }

  return fieldDefinition;
};

/**
 * Generates a structure representing a Payload CMS CollectionConfig object
 * from a parsed Convex table definition.
 *
 * @param parsedTable - The parsed table information from the schema parser.
 * @returns A structure representing a Payload CMS CollectionConfig object.
 */
export const generatePayloadCollection = (parsedTable: ParsedTable): any => {
  console.log(
    `Generating Payload collection for Convex table: ${parsedTable.name}`,
  );

  // --- Default Config Generation (Subtask 2.11) ---
  const collectionSlug = parsedTable.name;
  const isAdmin = true; // TODO: Make configurable?

  // Determine useAsTitle - use first string field found, fallback to 'id'
  const titleField = parsedTable.fields.find(
    (f) => f.parsedValidator?.type === "string",
  );
  const useAsTitle = titleField?.name ?? "id";

  // Basic admin config
  const adminConfig: any = {
    useAsTitle: useAsTitle,
    // TODO: Add defaultColumns?
  };

  // Basic access control (defaulting to public read, admin only create/update/delete)
  const accessConfig: any = {
    read: () => true, // Use actual functions now, not strings
    create: ({ req }: { req: PayloadRequest }) => true, // Keep req typed
    update: ({ req }: { req: PayloadRequest }) => true, // Keep req typed
    delete: ({ req }: { req: PayloadRequest }) => true, // Keep req typed
  };

  // --- Field Mapping (Subtask 2.9) ---
  const fields: any[] = parsedTable.fields
    .map((field) => {
      if (!field.parsedValidator) {
        console.warn(
          `Field '${field.name}' in table '${parsedTable.name}' has no parsed validator. Skipping.`,
        );
        return null;
      }
      return mapValidatorToPayloadField(field.parsedValidator, field.name);
    })
    .filter((field): field is any => field !== null);

  // --- Index Mapping (Subtask 2.10) ---
  const indexes: any[] = parsedTable.indexes.map((idx): any => ({
    fields: idx.fields.reduce(
      (acc, fieldName) => {
        acc[fieldName] = 1; // Assume ascending index
        return acc;
      },
      {} as Record<string, number>,
    ),
    options: { name: idx.name, unique: false }, // TODO: How to determine unique from Convex?
  }));

  // --- Assemble Collection Config (Subtask 2.12 - partially) ---
  const collectionConfig: any = {
    slug: collectionSlug,
    admin: adminConfig,
    access: accessConfig,
    fields: fields,
    timestamps: true, // Default timestamp tracking
    // Only enable auth for 'users' collection by convention
    auth: collectionSlug === "users" || undefined,
    indexes: indexes.length > 0 ? indexes : undefined,
    // TODO: Add hooks? Versioning? Other options?
  };

  console.log(
    `Generated config object for ${collectionSlug}.`, // Don't log potentially huge object here
  );

  return collectionConfig;
};
