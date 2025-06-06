"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertCircle,
  ChevronRight,
  GripVertical,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";

import { NODE_TYPES, NodeTypeDefinition } from "./NodeTypes";

// Node representation in the canvas
interface ScenarioNode {
  id: string;
  type: string;
  position: number;
  config: Record<string, unknown>;
  nodeType: NodeTypeDefinition;
}

interface ScenarioCanvasProps {
  scenarioId: string;
  nodes: ScenarioNode[];
  onAddNode?: (nodeType: NodeTypeDefinition, position: number) => void;
  onRemoveNode?: (nodeId: string) => void;
  onReorderNodes?: (nodeIds: string[]) => void;
  onConfigureNode?: (nodeId: string) => void;
}

export default function ScenarioCanvas({
  scenarioId,
  nodes = [],
  onRemoveNode,
  onConfigureNode,
}: ScenarioCanvasProps) {
  // State for dragging/adding nodes
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggedNodeType, setDraggedNodeType] =
    useState<NodeTypeDefinition | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Monitor drag events for the entire canvas
  useDndMonitor({
    onDragStart(event) {
      const { active } = event;
      const nodeType = active.data?.current?.nodeType as NodeTypeDefinition;

      if (nodeType) {
        setDraggedNodeType(nodeType);
      }

      if (typeof active.id === "string" && active.id.startsWith("node-")) {
        setActiveNodeId(active.id.replace("node-", ""));
      }
    },
    onDragEnd() {
      setDraggedNodeType(null);
      setActiveNodeId(null);
      setIsDraggingOver(false);
    },
    onDragCancel() {
      setDraggedNodeType(null);
      setActiveNodeId(null);
      setIsDraggingOver(false);
    },
  });

  // Empty space droppable (for adding new nodes)
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: "canvas-drop-area",
    data: {
      type: "canvas",
      scenarioId,
    },
  });

  useEffect(() => {
    setIsDraggingOver(isOver);
  }, [isOver]);

  return (
    <div className="flex h-full flex-col">
      <div
        ref={setDroppableRef}
        className={`flex-1 rounded-lg border-2 border-dashed p-4 transition-colors ${
          isDraggingOver
            ? "border-blue-400 bg-blue-50"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        <div ref={canvasRef} className="min-h-[300px] space-y-2">
          {nodes.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12">
              <div className="rounded-full bg-gray-100 p-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No nodes yet</h3>
              <p className="mt-2 max-w-md text-center text-sm text-gray-500">
                Drag and drop nodes from the sidebar to build your integration
                scenario
              </p>
            </div>
          ) : (
            nodes.map((node) => (
              <ScenarioNodeItem
                key={node.id}
                node={node}
                onRemove={onRemoveNode}
                onConfigure={onConfigureNode}
                isActive={activeNodeId === node.id}
              />
            ))
          )}

          {isDraggingOver && draggedNodeType && (
            <div className="animate-pulse rounded-lg border-2 border-blue-400 bg-blue-50 p-4">
              <div className="flex items-center space-x-2">
                <div className="rounded-md bg-white p-1.5">
                  {draggedNodeType.icon}
                </div>
                <div className="font-medium">{draggedNodeType.name}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Individual node item in the canvas
interface ScenarioNodeItemProps {
  node: ScenarioNode;
  onRemove?: (nodeId: string) => void;
  onConfigure?: (nodeId: string) => void;
  isActive?: boolean;
}

function ScenarioNodeItem({
  node,
  onRemove,
  onConfigure,
  isActive = false,
}: ScenarioNodeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `node-${node.id}`,
    data: {
      nodeId: node.id,
      type: "scenario-node",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  // Get the corresponding node type definition
  const nodeType = NODE_TYPES.find((type) => type.id === node.type) ?? {
    name: "Unknown Node",
    description: "Node type not found",
    category: "action" as const,
    icon: <AlertCircle size={24} />,
    color: "bg-gray-50 border-gray-200",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-lg border-2 transition-all ${nodeType.color} ${
        isActive ? "ring-2 ring-blue-500" : ""
      }`}
      {...attributes}
    >
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="cursor-move touch-none" {...listeners}>
                <GripVertical className="h-5 w-5 text-gray-500" />
              </div>

              <div className="rounded-md bg-white bg-opacity-50 p-1.5">
                {nodeType.icon}
              </div>

              <div>
                <h3 className="font-medium">{nodeType.name}</h3>
                <p className="text-xs text-gray-600">{node.id}</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => onConfigure?.(node.id)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Configure Node</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onConfigure?.(node.id)}>
                    Configure
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onRemove?.(node.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
