"use client";

import React, { useEffect, useMemo } from "react";

import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { useGroupContext } from "../PuckGroupProvider";

interface GroupFieldProps {
  name: string;
  value: string | undefined;
  onChange: (value: string) => void;
  label?: string;
}

export function GroupField({
  name,
  value,
  onChange,
  label = "Group",
}: GroupFieldProps) {
  const { currentGroupId, groupOptions, isLoading } = useGroupContext();

  // Set the current group ID as the default value if no value is provided
  useEffect(() => {
    if (!value && currentGroupId && !isLoading) {
      onChange(currentGroupId as string);
    }
  }, [value, currentGroupId, onChange, isLoading]);

  const options = useMemo(() => {
    if (isLoading) {
      return [{ label: "Loading groups...", value: "" }];
    }

    if (groupOptions.length === 0) {
      return [{ label: "No groups available", value: "" }];
    }

    return groupOptions;
  }, [groupOptions, isLoading]);

  return (
    <div className="mb-4">
      <Label htmlFor={name} className="mb-2 block">
        {label}
      </Label>
      <Select value={value ?? ""} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger id={name} className="w-full">
          <SelectValue placeholder="Select a group" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
