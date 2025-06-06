"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import DroppableField from "./DroppableField";
import { FieldItem, MappingItem } from "./types";

export interface TargetPanelProps {
  fields: FieldItem[];
  mappings: MappingItem[];
}

const TargetPanel: React.FC<TargetPanelProps> = ({ fields, mappings }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  // Filter fields based on search term
  const filteredFields = fields.filter((field) => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    return (
      field.name.toLowerCase().includes(term) ||
      field.path.toLowerCase().includes(term) ||
      field.type.toLowerCase().includes(term)
    );
  });

  // Check if a field is mapped
  const isFieldMapped = (fieldId: string) => {
    return mappings.some((mapping) => mapping.targetFieldId === fieldId);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search fields..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1">
        {filteredFields.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            {fields.length === 0
              ? "No fields available"
              : "No fields matching search"}
          </div>
        ) : (
          filteredFields.map((field) => (
            <DroppableField
              key={field.id}
              id={`target-${field.path}`}
              field={field}
              type="target"
              isActive={activeFieldId === field.id}
              isMapped={isFieldMapped(field.id)}
              className="hover:shadow-sm"
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TargetPanel;
