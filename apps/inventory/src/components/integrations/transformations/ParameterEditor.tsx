"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { DataType, ParameterEditorProps } from "./types";

const ParameterEditor: React.FC<ParameterEditorProps> = ({
  parameters,
  values,
  onChange,
}) => {
  const renderInput = (
    param: {
      name: string;
      type: DataType;
      required: boolean;
      description: string;
      defaultValue?: unknown;
      enum?: unknown[];
    },
    value: unknown,
  ) => {
    const handleChange = (newValue: unknown) => {
      onChange(param.name, newValue);
    };

    // If parameter has enum values, render a select
    if (param.enum && param.enum.length > 0) {
      return (
        <Select value={value?.toString() ?? ""} onValueChange={handleChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={`Select ${param.name}...`} />
          </SelectTrigger>
          <SelectContent>
            {param.enum.map((option) => (
              <SelectItem key={String(option)} value={String(option)}>
                {String(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Based on parameter type, render appropriate input
    switch (param.type) {
      case DataType.String:
        if (param.description?.includes("multiline")) {
          return (
            <Textarea
              value={value?.toString() ?? ""}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={param.description}
              className="min-h-[80px] text-xs"
            />
          );
        }
        return (
          <Input
            type="text"
            value={value?.toString() ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={param.description}
            className="h-8 text-xs"
          />
        );

      case DataType.Number:
        return (
          <Input
            type="number"
            value={value?.toString() ?? ""}
            onChange={(e) => {
              const numValue =
                e.target.value === "" ? "" : Number(e.target.value);
              handleChange(numValue);
            }}
            placeholder={param.description}
            className="h-8 text-xs"
          />
        );

      case DataType.Boolean:
        return (
          <Checkbox checked={Boolean(value)} onCheckedChange={handleChange} />
        );

      default:
        return (
          <Input
            type="text"
            value={value?.toString() ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={param.description}
            className="h-8 text-xs"
          />
        );
    }
  };

  return (
    <div className="space-y-3">
      {parameters.map((param) => (
        <div key={param.name} className="grid grid-cols-3 gap-2">
          <label className="col-span-1 text-xs font-medium">
            {param.name}
            {param.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <div className="col-span-2">
            {renderInput(param, values[param.name] ?? param.defaultValue ?? "")}
            {param.description && (
              <p className="mt-1 text-xs text-muted-foreground">
                {param.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ParameterEditor;
