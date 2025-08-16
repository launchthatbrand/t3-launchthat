"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import type { Node } from "@xyflow/react";
import { useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { Plus } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui";

// Available node types for integration scenarios
const AVAILABLE_NODE_TYPES = [
  {
    type: "core.passThrough",
    label: "Pass Through",
    rfType: "node-with-toolbar",
    description: "Passes data through without modification",
  },
  {
    type: "core.enhancedPassThrough",
    label: "Enhanced Pass Through",
    rfType: "node-with-toolbar",
    description: "Enhanced pass through with additional features",
  },
  {
    type: "webhooks_action",
    label: "Webhook Action",
    rfType: "node-with-toolbar",
    description: "Sends webhook notifications",
  },
  {
    type: "http.request",
    label: "HTTP Request",
    rfType: "node-with-toolbar",
    description: "Makes HTTP requests to external APIs",
  },
  {
    type: "data.transform",
    label: "Transform Data",
    rfType: "node-with-toolbar",
    description: "Transforms and manipulates data",
  },
] as const;

interface CreateNodeProps {
  scenarioId: Id<"scenarios"> | null;
  onNodeCreate?: (node: Partial<Node>) => void;
}

export default function CreateNode({
  scenarioId,
  onNodeCreate,
}: CreateNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [nodeLabel, setNodeLabel] = useState<string>("");
  const { screenToFlowPosition } = useReactFlow();

  const handleCreateNode = () => {
    if (!selectedType || !nodeLabel.trim() || !scenarioId) {
      return;
    }

    const selectedNodeType = AVAILABLE_NODE_TYPES.find(
      (nt) => nt.type === selectedType,
    );
    if (!selectedNodeType) return;

    // Calculate position in the center of the current viewport
    const centerPosition = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    // Create a new node with proper React Flow properties
    const newNode: Partial<Node> = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: selectedNodeType.rfType,
      position: centerPosition,
      data: {
        type: selectedType,
        label: nodeLabel,
        scenarioId,
        config: {},
        // Additional React Flow specific data
        nodeId: null, // Will be set when saved to backend
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      // Set default dimensions
      width: 200,
      height: 100,
    };

    // Call the callback to add the node to the flow
    onNodeCreate?.(newNode);

    // Reset form and close dialog
    setSelectedType("");
    setNodeLabel("");
    setIsOpen(false);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNodeLabel(e.target.value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="absolute left-4 top-4 z-10"
          disabled={!scenarioId}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Node
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Node</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="node-type">Node Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a node type" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_NODE_TYPES.map((nodeType) => (
                  <SelectItem key={nodeType.type} value={nodeType.type}>
                    <div>
                      <div className="font-medium">{nodeType.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {nodeType.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="node-label">Label</Label>
            <Input
              id="node-label"
              value={nodeLabel}
              onChange={handleLabelChange}
              placeholder="Enter node label"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateNode}
            disabled={!selectedType || !nodeLabel.trim()}
          >
            Create Node
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
