"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import DraggableField from "./DraggableField";
import { FieldItem } from "./types";

export interface SourcePanelProps {
  fields: FieldItem[];
}

const SourcePanel: React.FC<SourcePanelProps> = ({ fields }) => {
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
            <DraggableField
              key={field.id}
              field={field}
              type="source"
              isActive={activeFieldId === field.id}
              disabled={false}
              className="hover:shadow-sm"
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SourcePanel;
