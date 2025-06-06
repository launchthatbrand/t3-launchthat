"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { nanoid } from "nanoid";

import MappingPanel from "./MappingPanel";
import SourcePanel from "./SourcePanel";
import TargetPanel from "./TargetPanel";
import {
  DataSchema,
  DataType,
  FieldItem,
  MappingItem,
  SchemaField,
  TransformationItem,
} from "./types";

export interface DataMappingBuilderProps {
  initialMapping?: {
    id: string;
    name: string;
    description?: string;
    sourceSchema: string;
    targetSchema: string;
    mappings: MappingItem[];
  };
  availableSchemas?: DataSchema[];
  transformations: TransformationItem[];
}

const DataMappingBuilder: React.FC<DataMappingBuilderProps> = ({
  initialMapping,
  availableSchemas = [],
  transformations = [],
}) => {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mappingName, setMappingName] = useState(initialMapping?.name || "");
  const [description, setDescription] = useState(
    initialMapping?.description || "",
  );
  const [mappingId] = useState(initialMapping?.id || `mapping_${nanoid()}`);

  // Schema selection state
  const [sourceSchemaId, setSourceSchemaId] = useState<string>(
    initialMapping?.sourceSchema || "",
  );
  const [targetSchemaId, setTargetSchemaId] = useState<string>(
    initialMapping?.targetSchema || "",
  );
  const [sourceSchema, setSourceSchema] = useState<DataSchema | null>(null);
  const [targetSchema, setTargetSchema] = useState<DataSchema | null>(null);

  // Field and mapping state
  const [sourceFields, setSourceFields] = useState<FieldItem[]>([]);
  const [targetFields, setTargetFields] = useState<FieldItem[]>([]);
  const [mappings, setMappings] = useState<MappingItem[]>(
    initialMapping?.mappings || [],
  );

  // For API loading schemas
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(true);
  const [schemas, setSchemas] = useState<DataSchema[]>(availableSchemas);

  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // Fetch schemas if not provided
  useEffect(() => {
    const fetchSchemas = async () => {
      if (availableSchemas.length > 0) {
        setSchemas(availableSchemas);
        setIsLoadingSchemas(false);
        return;
      }

      try {
        setIsLoadingSchemas(true);
        const response = await fetch(
          "/api/integrations/transformations/schemas",
        );
        const data = await response.json();
        if (data.success) {
          setSchemas(data.schemas);
        } else {
          throw new Error(data.error || "Failed to load schemas");
        }
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to load schemas",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSchemas(false);
      }
    };

    void fetchSchemas();
  }, [availableSchemas, toast]);

  // Load source schema
  useEffect(() => {
    if (!sourceSchemaId || isLoadingSchemas) return;

    const schema = schemas.find((s) => s.id === sourceSchemaId);
    if (schema) {
      setSourceSchema(schema);
      const fields = flattenSchemaFields(schema.fields);
      setSourceFields(fields);
    }
  }, [sourceSchemaId, schemas, isLoadingSchemas]);

  // Load target schema
  useEffect(() => {
    if (!targetSchemaId || isLoadingSchemas) return;

    const schema = schemas.find((s) => s.id === targetSchemaId);
    if (schema) {
      setTargetSchema(schema);
      const fields = flattenSchemaFields(schema.fields);
      setTargetFields(fields);
    }
  }, [targetSchemaId, schemas, isLoadingSchemas]);

  // Flatten nested schema fields into a list of FieldItems
  const flattenSchemaFields = (
    fields: SchemaField[],
    parentId?: string,
  ): FieldItem[] => {
    let result: FieldItem[] = [];

    for (const field of fields) {
      const fieldItem: FieldItem = {
        id: field.path,
        name: field.name,
        path: field.path,
        type: field.type,
        required: field.required || false,
        description: field.description,
        parentId,
      };

      result.push(fieldItem);

      if (field.nested && field.nested.length > 0) {
        const nestedFields = flattenSchemaFields(field.nested, fieldItem.id);
        result = [...result, ...nestedFields];
      }
    }

    return result;
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const sourceId = String(active.id);
    const targetId = String(over.id);

    // Only handle source-to-target drops
    if (!sourceId.startsWith("source-") || !targetId.startsWith("target-")) {
      return;
    }

    const sourceFieldId = sourceId.replace("source-", "");
    const targetFieldId = targetId.replace("target-", "");

    // Check if mapping already exists
    const existingIndex = mappings.findIndex(
      (m) => m.targetFieldId === targetFieldId,
    );

    if (existingIndex >= 0) {
      // Update existing mapping
      const updatedMappings = [...mappings];
      const existingMapping = updatedMappings[existingIndex];

      // Create a new mapping object with the updated sourceFieldId
      updatedMappings[existingIndex] = {
        id: existingMapping.id,
        sourceFieldId,
        targetFieldId: existingMapping.targetFieldId,
        transformationId: existingMapping.transformationId,
        parameters: existingMapping.parameters,
      };

      setMappings(updatedMappings);

      toast({
        title: "Mapping updated",
        description: `Updated existing mapping for target field.`,
      });
    } else {
      // Add new mapping
      const newMapping: MappingItem = {
        id: `mapping_${nanoid()}`,
        sourceFieldId,
        targetFieldId,
      };

      setMappings([...mappings, newMapping]);

      toast({
        title: "Field mapped",
        description: `Source field mapped to target field.`,
      });
    }
  };

  // Remove a mapping
  const handleRemoveMapping = (mappingId: string) => {
    setMappings(mappings.filter((m) => m.id !== mappingId));
  };

  // Update a transformation for a mapping
  const handleTransformationChange = (
    mappingId: string,
    transformationId: string,
  ) => {
    setMappings(
      mappings.map((m) =>
        m.id === mappingId
          ? {
              ...m,
              transformationId,
              parameters: {}, // Reset parameters when changing transformation
            }
          : m,
      ),
    );
  };

  // Update parameters for a transformation
  const handleParameterChange = (
    mappingId: string,
    paramName: string,
    value: unknown,
  ) => {
    setMappings(
      mappings.map((m) =>
        m.id === mappingId
          ? {
              ...m,
              parameters: {
                ...(m.parameters || {}),
                [paramName]: value,
              },
            }
          : m,
      ),
    );
  };

  // Save the mapping configuration
  const handleSave = async () => {
    if (!mappingName) {
      toast({
        title: "Error",
        description: "Please provide a name for the mapping",
        variant: "destructive",
      });
      return;
    }

    if (!sourceSchemaId || !targetSchemaId) {
      toast({
        title: "Error",
        description: "Please select both source and target schemas",
        variant: "destructive",
      });
      return;
    }

    if (mappings.length === 0) {
      toast({
        title: "Error",
        description: "Please create at least one field mapping",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Convert mappings to the format expected by the API
      const apiMappings = mappings.map((m) => {
        const result: any = {
          sourceField: m.sourceFieldId,
          targetField: m.targetFieldId,
        };

        if (m.transformationId) {
          result.transformation = {
            functionId: m.transformationId,
            parameters: m.parameters || {},
          };
        }

        return result;
      });

      const mappingConfig = {
        id: mappingId,
        name: mappingName,
        description,
        sourceSchema: sourceSchemaId,
        targetSchema: targetSchemaId,
        mappings: apiMappings,
      };

      const response = await fetch(
        "/api/integrations/transformations/mappings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mapping: mappingConfig,
            overwrite: !!initialMapping, // Overwrite if editing an existing mapping
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Mapping configuration saved successfully",
        });

        // Navigate back to the list view
        router.push("/integrations/transformations");
      } else {
        throw new Error(data.error || "Failed to save mapping");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save mapping",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get source field by ID
  const getSourceField = (id: string) => {
    return sourceFields.find((f) => f.id === id);
  };

  // Get target field by ID
  const getTargetField = (id: string) => {
    return targetFields.find((f) => f.id === id);
  };

  // Get transformation by ID
  const getTransformation = (id: string) => {
    return transformations.find((t) => t.id === id);
  };

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="mapping-name"
              className="mb-2 block text-sm font-medium"
            >
              Mapping Name
            </label>
            <Input
              id="mapping-name"
              value={mappingName}
              onChange={(e) => setMappingName(e.target.value)}
              placeholder="Enter mapping name..."
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="source-schema"
                className="mb-2 block text-sm font-medium"
              >
                Source Schema
              </label>
              <Select
                value={sourceSchemaId}
                onValueChange={setSourceSchemaId}
                disabled={isLoading || isLoadingSchemas}
              >
                <SelectTrigger id="source-schema">
                  <SelectValue placeholder="Select source schema" />
                </SelectTrigger>
                <SelectContent>
                  {schemas.map((schema) => (
                    <SelectItem key={schema.id} value={schema.id}>
                      {schema.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="target-schema"
                className="mb-2 block text-sm font-medium"
              >
                Target Schema
              </label>
              <Select
                value={targetSchemaId}
                onValueChange={setTargetSchemaId}
                disabled={isLoading || isLoadingSchemas}
              >
                <SelectTrigger id="target-schema">
                  <SelectValue placeholder="Select target schema" />
                </SelectTrigger>
                <SelectContent>
                  {schemas.map((schema) => (
                    <SelectItem key={schema.id} value={schema.id}>
                      {schema.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div>
          <label
            htmlFor="mapping-description"
            className="mb-2 block text-sm font-medium"
          >
            Description
          </label>
          <Textarea
            id="mapping-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a description for this mapping..."
            disabled={isLoading}
          />
        </div>
      </div>

      {sourceSchemaId && targetSchemaId ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Source Fields</CardTitle>
                <CardDescription>
                  {sourceSchema?.name || "Source Schema"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SourcePanel fields={sourceFields} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mappings</CardTitle>
                <CardDescription>
                  Configure field mappings and transformations
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                <MappingPanel
                  mappings={mappings}
                  getSourceField={getSourceField}
                  getTargetField={getTargetField}
                  getTransformation={getTransformation}
                  transformations={transformations}
                  onRemoveMapping={handleRemoveMapping}
                  onTransformationChange={handleTransformationChange}
                  onParameterChange={handleParameterChange}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Target Fields</CardTitle>
                <CardDescription>
                  {targetSchema?.name || "Target Schema"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TargetPanel fields={targetFields} mappings={mappings} />
              </CardContent>
            </Card>
          </div>
        </DndContext>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-muted-foreground">
                Please select both source and target schemas to start mapping.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => router.push("/integrations/transformations")}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Mapping"}
        </Button>
      </div>
    </div>
  );
};

export default DataMappingBuilder;
