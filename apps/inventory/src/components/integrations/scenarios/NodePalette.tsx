"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DndContext, DragEndEvent, useDraggable } from "@dnd-kit/core";
import { Search } from "lucide-react";

import { NODE_TYPES, NodeTypeCategory, NodeTypeDefinition } from "./NodeTypes";

interface DraggableNodeProps {
  nodeType: NodeTypeDefinition;
}

function DraggableNode({ nodeType }: DraggableNodeProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `draggable-${nodeType.id}`,
    data: {
      nodeType,
      type: "node-type",
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab touch-none transition-opacity ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
      aria-label={`Drag ${nodeType.name} node`}
      role="button"
      tabIndex={0}
    >
      <Card className={`border-2 ${nodeType.color}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="mt-1 rounded-md bg-white bg-opacity-50 p-1.5">
              {nodeType.icon}
            </div>

            <div>
              <h3 className="font-medium">{nodeType.name}</h3>
              <p className="text-sm text-gray-600">{nodeType.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface NodePaletteProps {
  onDragEnd: (event: DragEndEvent) => void;
}

export default function NodePalette({ onDragEnd }: NodePaletteProps) {
  const [activeTab, setActiveTab] = useState<NodeTypeCategory | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter nodes based on search term and active tab
  const filteredNodeTypes = NODE_TYPES.filter((nodeType) => {
    const matchesSearch =
      nodeType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nodeType.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      activeTab === "all" || nodeType.category === activeTab;

    return matchesSearch && matchesCategory;
  });

  return (
    <DndContext onDragEnd={onDragEnd}>
      <Card className="h-full overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle>Node Types</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search nodes..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>

        <div className="px-6">
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as NodeTypeCategory | "all")
            }
          >
            <TabsList className="w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="trigger">Triggers</TabsTrigger>
              <TabsTrigger value="action">Actions</TabsTrigger>
              <TabsTrigger value="transformer">Transform</TabsTrigger>
              <TabsTrigger value="condition">Conditions</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <CardContent className="overflow-auto p-6 pt-3">
          <div className="space-y-3">
            {filteredNodeTypes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                <h3 className="font-medium text-gray-900">No matching nodes</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              filteredNodeTypes.map((nodeType) => (
                <DraggableNode key={nodeType.id} nodeType={nodeType} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </DndContext>
  );
}
