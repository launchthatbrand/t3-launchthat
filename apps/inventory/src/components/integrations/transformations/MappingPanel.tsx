"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

import ParameterEditor from "./ParameterEditor";
import { DataType, FieldItem, MappingItem, TransformationItem } from "./types";

export interface MappingPanelProps {
  mappings: MappingItem[];
  getSourceField: (id: string) => FieldItem | undefined;
  getTargetField: (id: string) => FieldItem | undefined;
  getTransformation: (id: string) => TransformationItem | undefined;
  transformations: TransformationItem[];
  onRemoveMapping: (id: string) => void;
  onTransformationChange: (mappingId: string, transformationId: string) => void;
  onParameterChange: (
    mappingId: string,
    paramName: string,
    value: unknown,
  ) => void;
}

const MappingPanel: React.FC<MappingPanelProps> = ({
  mappings,
  getSourceField,
  getTargetField,
  getTransformation,
  transformations,
  onRemoveMapping,
  onTransformationChange,
  onParameterChange,
}) => {
  if (mappings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <p className="mb-2 text-muted-foreground">No mappings created yet</p>
        <p className="text-sm text-muted-foreground">
          Drag source fields to target fields to create mappings
        </p>
      </div>
    );
  }

  // Get a list of compatible transformations for a source to target field mapping
  const getCompatibleTransformations = (
    sourceType: DataType,
    targetType: DataType,
  ) => {
    return transformations.filter((t) => {
      // Check if transformation supports the source type
      const supportsSourceType = t.inputTypes.includes(sourceType);

      // Check if transformation output matches target type
      const outputMatchesTarget = t.outputType === targetType;

      return supportsSourceType && outputMatchesTarget;
    });
  };

  return (
    <div className="space-y-4">
      {mappings.map((mapping) => {
        const sourceField = getSourceField(mapping.sourceFieldId);
        const targetField = getTargetField(mapping.targetFieldId);

        if (!sourceField || !targetField) {
          return null;
        }

        const transformation = mapping.transformationId
          ? getTransformation(mapping.transformationId)
          : undefined;

        const compatibleTransformations = getCompatibleTransformations(
          sourceField.type,
          targetField.type,
        );

        const isDirectlyCompatible =
          sourceField.type === targetField.type ||
          (sourceField.type === DataType.String &&
            targetField.type === DataType.Any) ||
          (sourceField.type === DataType.Number &&
            targetField.type === DataType.Any);

        return (
          <Card key={mapping.id} className="overflow-hidden">
            <CardHeader className="p-4 pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm">
                    {sourceField.name} → {targetField.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {sourceField.type} → {targetField.type}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveMapping(mapping.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {!isDirectlyCompatible &&
              compatibleTransformations.length === 0 ? (
                <div className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-700">
                  <p>
                    No compatible transformations available for these types.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-2">
                    <Select
                      value={mapping.transformationId ?? ""}
                      onValueChange={(value) =>
                        onTransformationChange(mapping.id, value)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue
                          placeholder={
                            isDirectlyCompatible
                              ? "Direct mapping (no transformation)"
                              : "Select a transformation"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {isDirectlyCompatible && (
                          <SelectItem value="">
                            Direct mapping (no transformation)
                          </SelectItem>
                        )}
                        {compatibleTransformations.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {transformation && (
                    <>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {transformation.description}
                      </div>
                      {transformation.parameters.length > 0 && (
                        <div className="mt-3">
                          <ParameterEditor
                            parameters={transformation.parameters}
                            values={mapping.parameters ?? {}}
                            onChange={(name, value) =>
                              onParameterChange(mapping.id, name, value)
                            }
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MappingPanel;
