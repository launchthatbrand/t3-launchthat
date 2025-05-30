import type { Node } from "ts-morph";

// Define a type for the parsed index information
export interface ParsedIndex {
  name: string;
  fields: string[];
}

// Define a type for the result of parsing a v.* validator node
export interface ParsedValidatorResult {
  type:
    | "string"
    | "number"
    | "boolean"
    | "null"
    | "any"
    | "id"
    | "literal"
    | "union"
    | "object"
    | "array"
    | "optional"
    | "unknown"; // Add other Convex types as needed
  isOptional: boolean;
  error?: string; // Optional error message for parsing issues
  // Specific details based on type
  tableName?: string; // For v.id()
  value?: string | number | boolean | bigint | null; // For v.literal()
  options?: ParsedValidatorResult[]; // For v.union()
  fields?: Map<string, ParsedValidatorResult>; // For v.object()
  elementType?: ParsedValidatorResult; // For v.array()
}

// Define a type for parsed field information
export interface ParsedField {
  name: string;
  validatorNode?: Node; // Made optional - Node reference (transient, not for serialization)
  parsedValidator?: ParsedValidatorResult; // Populated by parseValidators
}

// Define a type for the parsed table information
export interface ParsedTable {
  name: string;
  fields: ParsedField[];
  indexes: ParsedIndex[];
  // Store the node containing the fields object literal for parsing
  defineTableFieldsNode?: Node;
}
