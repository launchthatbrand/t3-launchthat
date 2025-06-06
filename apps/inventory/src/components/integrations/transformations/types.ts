import { ReactNode } from "react";

/**
 * Shared types for data mapping and transformation components
 */

/**
 * Data types supported by the transformation system
 */
export enum DataType {
  String = "string",
  Number = "number",
  Boolean = "boolean",
  Date = "date",
  Object = "object",
  Array = "array",
  Any = "any",
}

/**
 * Categories of transformations
 */
export enum TransformationCategory {
  String = "string",
  Number = "number",
  Date = "date",
  Conversion = "conversion",
  Logical = "logical",
  Array = "array",
  Advanced = "advanced",
}

/**
 * Parameter definition for a transformation function
 */
export interface TransformationParameter {
  name: string;
  type: DataType;
  required: boolean;
  description: string;
  defaultValue?: unknown;
  enum?: string[];
}

/**
 * Transformation function definition
 */
export interface TransformationItem {
  id: string;
  name: string;
  description: string;
  category: TransformationCategory;
  inputTypes: DataType[];
  outputType: DataType;
  parameters: TransformationParameter[];
  examples?: {
    input: unknown;
    params?: Record<string, unknown>;
    output: unknown;
  }[];
}

/**
 * Schema field definition representing a field in a data schema
 */
export interface SchemaField {
  name: string;
  path: string;
  type: DataType;
  description?: string;
  required?: boolean;
  isArray?: boolean;
  nested?: SchemaField[];
  metadata?: Record<string, unknown>;
}

/**
 * Data schema definition
 */
export interface DataSchema {
  id: string;
  name: string;
  description?: string;
  fields: SchemaField[];
  metadata?: Record<string, unknown>;
}

/**
 * Field mapping between source and target fields
 */
export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: {
    functionId: string;
    parameters: Record<string, unknown>;
  };
}

/**
 * Complete mapping configuration
 */
export interface MappingConfiguration {
  id: string;
  name: string;
  description?: string;
  sourceSchema: string;
  targetSchema: string;
  mappings: FieldMapping[];
  customJsTransform?: string;
}

/**
 * Props for the mapping configuration component
 */
export interface MappingConfigurationProps {
  id: string;
  sourceSchema: string;
  targetSchema: string;
}

/**
 * Field representation for the mapping UI
 */
export interface FieldItem {
  id: string;
  name: string;
  path: string;
  type: DataType;
  required: boolean;
  description?: string;
  parentId?: string;
}

/**
 * Mapping representation for the UI
 */
export interface MappingItem {
  id: string;
  sourceFieldId: string;
  targetFieldId: string;
  transformationId?: string;
  parameters?: Record<string, unknown>;
}

/**
 * Transformation function representation for the UI
 */
export interface TransformationItem {
  id: string;
  name: string;
  description: string;
  category: TransformationCategory;
  inputTypes: DataType[];
  outputType: DataType;
  parameters: TransformationParameter[];
}

/**
 * Props for the DraggableField component
 */
export interface DraggableFieldProps {
  field: FieldItem;
  children?: ReactNode;
  className?: string;
  isSource?: boolean;
}

/**
 * Props for the DroppableZone component
 */
export interface DroppableZoneProps {
  id: string;
  onDrop?: (sourceId: string, targetId: string) => void;
  children?: ReactNode;
  className?: string;
  acceptTypes?: DataType[];
  isDisabled?: boolean;
  validationResults?: ValidationResult[];
  validationMode?: "always" | "hover" | "never";
}

/**
 * Props for the FieldMapping component
 */
export interface FieldMappingProps {
  mapping: MappingItem;
  sourceField: FieldItem;
  targetField: FieldItem;
  transformation?: TransformationItem;
  onRemove: (id: string) => void;
  onTransformationChange: (mappingId: string, transformationId: string) => void;
  onParameterChange: (
    mappingId: string,
    paramName: string,
    value: unknown,
  ) => void;
}

/**
 * Props for the TransformationSelector component
 */
export interface TransformationSelectorProps {
  transformations: TransformationItem[];
  selectedCategory: TransformationCategory | "all";
  onCategoryChange: (category: TransformationCategory | "all") => void;
  onTransformationSelect: (transformation: TransformationItem) => void;
  compatibleWith?: DataType;
}

/**
 * Props for the ParameterEditor component
 */
export interface ParameterEditorProps {
  parameters: {
    name: string;
    type: DataType;
    required: boolean;
    description: string;
    defaultValue?: unknown;
    enum?: unknown[];
  }[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
  severity?: "warning" | "error" | "info";
}

/**
 * Validation rule interface
 */
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validate: (
    sourceField: FieldItem,
    targetField: FieldItem,
    transformation?: TransformationItem,
    parameters?: Record<string, unknown>,
  ) => ValidationResult;
}

/**
 * Type compatibility rule
 */
export interface TypeCompatibilityRule {
  sourceType: DataType;
  targetType: DataType;
  compatibleTransformations?: TransformationCategory[];
  isCompatible: boolean;
  message?: string;
}

/**
 * Props for the MappingValidationTooltip component
 */
export interface MappingValidationTooltipProps {
  validationResults: ValidationResult[];
  children: ReactNode;
}

/**
 * Props for the MappingConfigurationWithValidation component
 */
export interface MappingConfigurationWithValidationProps
  extends MappingConfigurationProps {
  validationRules?: ValidationRule[];
  typeCompatibilityRules?: TypeCompatibilityRule[];
  showValidationFeedback?: boolean;
}

/**
 * Sample data for previewing mappings
 */
export interface SampleData {
  id: string;
  name: string;
  data: Record<string, unknown>;
}

/**
 * Preview results for a mapping
 */
export interface MappingPreviewResult {
  sourceValue: unknown;
  targetValue: unknown;
  transformation?: {
    name: string;
    parameters: Record<string, unknown>;
  };
  isSuccess: boolean;
  error?: string;
}

/**
 * Props for the MappingPreview component
 */
export interface MappingPreviewProps {
  sourceFields: FieldItem[];
  targetFields: FieldItem[];
  mappings: MappingItem[];
  transformations: TransformationItem[];
  sampleData: SampleData[];
  onClose: () => void;
  onSelectSample: (sampleId: string) => void;
  selectedSampleId?: string;
  previewResults?: Record<string, MappingPreviewResult>;
  isLoading?: boolean;
}

/**
 * Type for the transformation execution function
 */
export type TransformExecutionFunction = (
  input: unknown,
  parameters?: Record<string, unknown>,
) => unknown;

/**
 * Mapping execution context
 */
export interface MappingExecutionContext {
  sourceData: Record<string, unknown>;
  targetData: Record<string, unknown>;
  transformationFunctions: Record<string, TransformExecutionFunction>;
}
