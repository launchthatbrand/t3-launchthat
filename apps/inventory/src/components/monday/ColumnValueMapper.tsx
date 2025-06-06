"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { PlusIcon, TrashIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import { Button } from "@acme/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Skeleton } from "@acme/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export interface ColumnValueMappingItem {
  mondayValue: string;
  convexValue: string;
}

export interface ColumnValueMapperProps {
  integrationId: Id<"mondayIntegration">;
  boardMappingId?: string;
  initialMappings?: ColumnValueMappingItem[];
  mondayColumnId?: string;
  convexFieldName?: string;
  onMappingsChange: (mappings: ColumnValueMappingItem[]) => void;
}

export function ColumnValueMapper({
  integrationId,
  boardMappingId,
  initialMappings = [],
  mondayColumnId,
  convexFieldName,
  onMappingsChange,
}: ColumnValueMapperProps) {
  const [mappings, setMappings] =
    useState<ColumnValueMappingItem[]>(initialMappings);
  const [selectedBoardMapping, setSelectedBoardMapping] = useState<
    string | undefined
  >(boardMappingId);
  const [selectedMondayColumn, setSelectedMondayColumn] = useState<
    string | undefined
  >(mondayColumnId);
  const [selectedConvexField, setSelectedConvexField] = useState<
    string | undefined
  >(convexFieldName);

  // Fetch board mappings
  const boardMappings = useQuery(api.monday.queries.getBoardMappings, {
    integrationId,
  });

  // Fetch monday columns for selected board mapping
  const mondayColumns = useQuery(
    api.monday.queries.getMondayColumns,
    selectedBoardMapping ? { boardMappingId: selectedBoardMapping } : "skip",
  );

  // Fetch convex fields for selected board mapping
  const convexFields = useQuery(
    api.monday.queries.getConvexFields,
    selectedBoardMapping ? { boardMappingId: selectedBoardMapping } : "skip",
  );

  // When board mapping changes, reset column and field selections
  useEffect(() => {
    if (selectedBoardMapping !== boardMappingId) {
      setSelectedMondayColumn(undefined);
      setSelectedConvexField(undefined);
    }
  }, [selectedBoardMapping, boardMappingId]);

  // Propagate changes to parent component
  useEffect(() => {
    onMappingsChange(mappings);
  }, [mappings, onMappingsChange]);

  const handleAddMapping = () => {
    setMappings([...mappings, { mondayValue: "", convexValue: "" }]);
  };

  const handleRemoveMapping = (index: number) => {
    const newMappings = [...mappings];
    newMappings.splice(index, 1);
    setMappings(newMappings);
  };

  const handleMappingChange = (
    index: number,
    field: "mondayValue" | "convexValue",
    value: string,
  ) => {
    const newMappings = [...mappings];
    newMappings[index][field] = value;
    setMappings(newMappings);
  };

  // Handle loading state
  if (!boardMappings) {
    return <Skeleton className="h-64" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Column Value Mapping</CardTitle>
        <CardDescription>
          Define how values should map between Monday.com and Convex
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="boardMapping">Board Mapping</Label>
            <Select
              value={selectedBoardMapping}
              onValueChange={setSelectedBoardMapping}
              disabled={!!boardMappingId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a board mapping" />
              </SelectTrigger>
              <SelectContent>
                {boardMappings.map((mapping) => (
                  <SelectItem key={mapping._id} value={mapping._id}>
                    {mapping.mondayBoardName} ↔{" "}
                    {mapping.convexTableDisplayName ?? mapping.convexTableName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mondayColumn">Monday.com Column</Label>
            <Select
              value={selectedMondayColumn}
              onValueChange={setSelectedMondayColumn}
              disabled={!selectedBoardMapping || !!mondayColumnId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a Monday column" />
              </SelectTrigger>
              <SelectContent>
                {mondayColumns?.map((column) => (
                  <SelectItem key={column.id} value={column.id}>
                    {column.title} ({column.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="convexField">Convex Field</Label>
            <Select
              value={selectedConvexField}
              onValueChange={setSelectedConvexField}
              disabled={!selectedBoardMapping || !!convexFieldName}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a Convex field" />
              </SelectTrigger>
              <SelectContent>
                {convexFields?.map((field) => (
                  <SelectItem key={field.name} value={field.name}>
                    {field.displayName ?? field.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monday.com Value</TableHead>
                <TableHead>Convex Value</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={mapping.mondayValue}
                      onChange={(e) =>
                        handleMappingChange(
                          index,
                          "mondayValue",
                          e.target.value,
                        )
                      }
                      placeholder="Enter Monday.com value"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={mapping.convexValue}
                      onChange={(e) =>
                        handleMappingChange(
                          index,
                          "convexValue",
                          e.target.value,
                        )
                      }
                      placeholder="Enter Convex value"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMapping(index)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {mappings.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No mappings defined. Click 'Add Mapping' to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddMapping}
          className="mt-2"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Mapping
        </Button>
      </CardContent>
    </Card>
  );
}
