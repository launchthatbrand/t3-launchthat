import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowRightLeft,
  Box,
  BrainCircuit,
  Clock,
  Database,
  FileJson,
  Filter,
  Flashlight,
  MailOpen,
  Webhook,
  Zap,
} from "lucide-react";

// Node type definitions
export type NodeTypeCategory =
  | "trigger"
  | "action"
  | "transformer"
  | "condition";

export interface NodeTypeDefinition {
  id: string;
  name: string;
  description: string;
  category: NodeTypeCategory;
  icon: React.ReactNode;
  color: string;
}

// Predefined node types
export const NODE_TYPES: NodeTypeDefinition[] = [
  // Trigger nodes
  {
    id: "webhook-trigger",
    name: "Webhook",
    description: "Trigger when a webhook is received",
    category: "trigger",
    icon: <Webhook size={24} />,
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    id: "polling-trigger",
    name: "Polling",
    description: "Check for changes at regular intervals",
    category: "trigger",
    icon: <Clock size={24} />,
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    id: "scheduled-trigger",
    name: "Schedule",
    description: "Run at specified times or intervals",
    category: "trigger",
    icon: <Clock size={24} />,
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },

  // Action nodes
  {
    id: "api-request",
    name: "API Request",
    description: "Make HTTP requests to external APIs",
    category: "action",
    icon: <Zap size={24} />,
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },
  {
    id: "database-action",
    name: "Database",
    description: "Query or modify database records",
    category: "action",
    icon: <Database size={24} />,
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },
  {
    id: "email-action",
    name: "Email",
    description: "Send emails based on triggers",
    category: "action",
    icon: <MailOpen size={24} />,
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },

  // Transformer nodes
  {
    id: "data-mapper",
    name: "Data Mapper",
    description: "Map fields from one format to another",
    category: "transformer",
    icon: <ArrowRightLeft size={24} />,
    color: "bg-green-50 border-green-200 text-green-700",
  },
  {
    id: "filter",
    name: "Filter",
    description: "Include or exclude data based on criteria",
    category: "transformer",
    icon: <Filter size={24} />,
    color: "bg-green-50 border-green-200 text-green-700",
  },
  {
    id: "json-transform",
    name: "JSON Transform",
    description: "Parse, manipulate, or generate JSON",
    category: "transformer",
    icon: <FileJson size={24} />,
    color: "bg-green-50 border-green-200 text-green-700",
  },

  // Condition nodes
  {
    id: "if-condition",
    name: "If Condition",
    description: "Branch based on conditional logic",
    category: "condition",
    icon: <AlertTriangle size={24} />,
    color: "bg-amber-50 border-amber-200 text-amber-700",
  },
  {
    id: "data-validation",
    name: "Data Validation",
    description: "Validate data against a schema",
    category: "condition",
    icon: <Flashlight size={24} />,
    color: "bg-amber-50 border-amber-200 text-amber-700",
  },
  {
    id: "ai-decision",
    name: "AI Decision",
    description: "Make decisions using AI",
    category: "condition",
    icon: <BrainCircuit size={24} />,
    color: "bg-amber-50 border-amber-200 text-amber-700",
  },
];

interface NodeTypesProps {
  filter?: NodeTypeCategory;
  onSelect: (nodeType: NodeTypeDefinition) => void;
}

export default function NodeTypes({ filter, onSelect }: NodeTypesProps) {
  // Filter node types based on category if a filter is provided
  const filteredNodeTypes = filter
    ? NODE_TYPES.filter((nodeType) => nodeType.category === filter)
    : NODE_TYPES;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredNodeTypes.map((nodeType) => (
          <Card
            key={nodeType.id}
            className={`cursor-pointer border-2 transition-all hover:shadow-md ${nodeType.color}`}
            onClick={() => onSelect(nodeType)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="mt-1 rounded-md bg-white bg-opacity-50 p-1.5">
                  {nodeType.icon}
                </div>

                <div>
                  <h3 className="font-medium">{nodeType.name}</h3>
                  <p className="text-sm text-gray-600">
                    {nodeType.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNodeTypes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Box className="h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No node types available</h3>
          <p className="mt-2 text-sm text-gray-500">
            No node types match the selected filter
          </p>
        </div>
      )}
    </div>
  );
}
