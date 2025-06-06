"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Info, XCircle } from "lucide-react";

import type {
  FieldItem,
  MappingPreviewProps,
  TransformationItem,
} from "./types";

/**
 * Component for previewing data mappings with real-time transformation results
 */
const MappingPreview: React.FC<MappingPreviewProps> = ({
  sourceFields,
  targetFields,
  mappings,
  transformations,
  sampleData,
  onClose,
  onSelectSample,
  selectedSampleId,
  previewResults = {},
  isLoading = false,
}) => {
  // Local state for expanded mapping details
  const [expandedMappingId, setExpandedMappingId] = useState<string | null>(
    null,
  );

  // Find field by ID
  const findFieldById = (id: string): FieldItem | undefined => {
    return [...sourceFields, ...targetFields].find((field) => field.id === id);
  };

  // Find transformation by ID
  const findTransformationById = (
    id: string | undefined,
  ): TransformationItem | undefined => {
    if (!id) return undefined;
    return transformations.find((t) => t.id === id);
  };

  // Helper to format values for display
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return "null";
    }

    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }

    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }

    return String(value);
  };

  // Helper to truncate long strings
  const truncate = (str: string, maxLength = 50): string => {
    if (str.length <= maxLength) return str;
    return `${str.substring(0, maxLength)}...`;
  };

  // Handle expanding a row for more details
  const toggleExpandMapping = (mappingId: string) => {
    if (expandedMappingId === mappingId) {
      setExpandedMappingId(null);
    } else {
      setExpandedMappingId(mappingId);
    }
  };

  // Get current sample data
  const currentSample = sampleData.find(
    (sample) => sample.id === selectedSampleId,
  );

  // Calculate success rate
  const successCount = Object.values(previewResults).filter(
    (result) => result.isSuccess,
  ).length;
  const totalCount = Object.keys(previewResults).length;
  const successRate =
    totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mapping Preview</DialogTitle>
          <DialogDescription>
            Preview how your data will be transformed using sample data
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Sample Data:</span>
            <Select
              value={selectedSampleId}
              onValueChange={(value) => onSelectSample(value)}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a sample" />
              </SelectTrigger>
              <SelectContent>
                {sampleData.map((sample) => (
                  <SelectItem key={sample.id} value={sample.id}>
                    {sample.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Success rate summary */}
          {!isLoading && totalCount > 0 && (
            <div className="flex items-center space-x-2 rounded-md bg-slate-50 px-3 py-1">
              <span className="text-sm font-medium">Success Rate:</span>
              <span
                className={`text-sm font-bold ${
                  successRate > 80
                    ? "text-green-600"
                    : successRate > 50
                      ? "text-amber-600"
                      : "text-red-600"
                }`}
              >
                {successRate}%
              </span>
              <span className="text-xs text-slate-500">
                ({successCount}/{totalCount})
              </span>
            </div>
          )}
        </div>

        {/* No sample selected message */}
        {!selectedSampleId && (
          <Card>
            <CardContent className="flex h-40 items-center justify-center">
              <p className="text-center text-slate-500">
                Select a sample dataset to preview the mapping results
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {isLoading && selectedSampleId && (
          <Card>
            <CardHeader>
              <CardTitle>Processing Sample Data</CardTitle>
              <CardDescription>
                Applying transformations to the sample data...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results table */}
        {!isLoading && selectedSampleId && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Source Field</TableHead>
                  <TableHead>Transformation</TableHead>
                  <TableHead>Target Field</TableHead>
                  <TableHead>Source Value</TableHead>
                  <TableHead>Target Value</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => {
                  const sourceField = findFieldById(mapping.sourceFieldId);
                  const targetField = findFieldById(mapping.targetFieldId);
                  const transformation = findTransformationById(
                    mapping.transformationId,
                  );
                  const previewResult = previewResults[mapping.id];
                  const isExpanded = expandedMappingId === mapping.id;

                  if (!sourceField || !targetField) return null;

                  return (
                    <React.Fragment key={mapping.id}>
                      <TableRow
                        className={
                          isExpanded ? "border-b-0 bg-slate-50" : undefined
                        }
                      >
                        {/* Status */}
                        <TableCell>
                          {previewResult ? (
                            previewResult.isSuccess ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )
                          ) : (
                            <Info className="h-5 w-5 text-slate-300" />
                          )}
                        </TableCell>

                        {/* Source Field */}
                        <TableCell className="font-medium">
                          {sourceField.name}
                        </TableCell>

                        {/* Transformation */}
                        <TableCell>
                          {transformation ? (
                            <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                              {transformation.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">
                              Direct
                            </span>
                          )}
                        </TableCell>

                        {/* Target Field */}
                        <TableCell className="font-medium">
                          {targetField.name}
                        </TableCell>

                        {/* Source Value */}
                        <TableCell className="max-w-[150px] truncate font-mono text-xs">
                          {previewResult ? (
                            truncate(formatValue(previewResult.sourceValue))
                          ) : currentSample ? (
                            truncate(
                              formatValue(currentSample.data[sourceField.path]),
                            )
                          ) : (
                            <span className="text-slate-400">No value</span>
                          )}
                        </TableCell>

                        {/* Target Value */}
                        <TableCell
                          className={`max-w-[150px] truncate font-mono text-xs ${
                            previewResult && !previewResult.isSuccess
                              ? "text-red-600"
                              : ""
                          }`}
                        >
                          {previewResult ? (
                            previewResult.isSuccess ? (
                              truncate(formatValue(previewResult.targetValue))
                            ) : (
                              truncate(previewResult.error ?? "Error")
                            )
                          ) : (
                            <span className="text-slate-400">No value</span>
                          )}
                        </TableCell>

                        {/* Expand Button */}
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpandMapping(mapping.id)}
                          >
                            {isExpanded ? "Hide" : "Details"}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded details */}
                      {isExpanded && (
                        <TableRow className="bg-slate-50">
                          <TableCell colSpan={7} className="p-0">
                            <div className="overflow-hidden px-4 pb-4">
                              <div className="rounded-md border bg-white p-4">
                                <h4 className="mb-2 font-medium">
                                  Mapping Details
                                </h4>

                                <div className="mb-4 grid grid-cols-2 gap-4">
                                  <div>
                                    <h5 className="mb-1 text-sm font-medium">
                                      Source Field
                                    </h5>
                                    <div className="rounded-md bg-slate-100 p-2">
                                      <p className="text-xs">
                                        <strong>Name:</strong>{" "}
                                        {sourceField.name}
                                      </p>
                                      <p className="text-xs">
                                        <strong>Path:</strong>{" "}
                                        {sourceField.path}
                                      </p>
                                      <p className="text-xs">
                                        <strong>Type:</strong>{" "}
                                        {sourceField.type}
                                      </p>
                                      {sourceField.description && (
                                        <p className="mt-1 text-xs text-slate-500">
                                          {sourceField.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <h5 className="mb-1 text-sm font-medium">
                                      Target Field
                                    </h5>
                                    <div className="rounded-md bg-slate-100 p-2">
                                      <p className="text-xs">
                                        <strong>Name:</strong>{" "}
                                        {targetField.name}
                                      </p>
                                      <p className="text-xs">
                                        <strong>Path:</strong>{" "}
                                        {targetField.path}
                                      </p>
                                      <p className="text-xs">
                                        <strong>Type:</strong>{" "}
                                        {targetField.type}
                                      </p>
                                      {targetField.description && (
                                        <p className="mt-1 text-xs text-slate-500">
                                          {targetField.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Transformation details if applicable */}
                                {transformation && (
                                  <div className="mb-4">
                                    <h5 className="mb-1 text-sm font-medium">
                                      Transformation
                                    </h5>
                                    <div className="rounded-md bg-slate-100 p-2">
                                      <p className="text-xs">
                                        <strong>Name:</strong>{" "}
                                        {transformation.name}
                                      </p>
                                      <p className="text-xs">
                                        <strong>Category:</strong>{" "}
                                        {transformation.category}
                                      </p>
                                      <p className="text-xs">
                                        <strong>Description:</strong>{" "}
                                        {transformation.description}
                                      </p>

                                      {/* Parameters */}
                                      {transformation.parameters.length > 0 && (
                                        <div className="mt-2">
                                          <p className="text-xs font-medium">
                                            Parameters:
                                          </p>
                                          <div className="mt-1 space-y-1">
                                            {transformation.parameters.map(
                                              (param) => (
                                                <p
                                                  key={param.name}
                                                  className="text-xs"
                                                >
                                                  <strong>{param.name}:</strong>{" "}
                                                  {formatValue(
                                                    mapping.parameters?.[
                                                      param.name
                                                    ] ?? param.defaultValue,
                                                  )}
                                                </p>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Preview values */}
                                <div>
                                  <h5 className="mb-1 text-sm font-medium">
                                    Preview Values
                                  </h5>
                                  <div className="rounded-md bg-slate-100 p-2">
                                    <div className="mb-2">
                                      <p className="text-xs font-medium">
                                        Source Value:
                                      </p>
                                      <pre className="mt-1 max-h-24 overflow-auto rounded-md bg-white p-2 text-xs">
                                        {previewResult
                                          ? formatValue(
                                              previewResult.sourceValue,
                                            )
                                          : currentSample
                                            ? formatValue(
                                                currentSample.data[
                                                  sourceField.path
                                                ],
                                              )
                                            : "No value"}
                                      </pre>
                                    </div>

                                    <div>
                                      <p
                                        className={`text-xs font-medium ${
                                          previewResult &&
                                          !previewResult.isSuccess
                                            ? "text-red-600"
                                            : ""
                                        }`}
                                      >
                                        Target Value:
                                      </p>
                                      <pre
                                        className={`mt-1 max-h-24 overflow-auto rounded-md p-2 text-xs ${
                                          previewResult &&
                                          !previewResult.isSuccess
                                            ? "bg-red-50"
                                            : "bg-white"
                                        }`}
                                      >
                                        {previewResult
                                          ? previewResult.isSuccess
                                            ? formatValue(
                                                previewResult.targetValue,
                                              )
                                            : (previewResult.error ?? "Error")
                                          : "No value"}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* No mappings message */}
                {mappings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <p className="text-slate-500">
                        No mappings defined. Create mappings to preview data.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MappingPreview;
