"use client";

import { Handle, NodeToolbar, Position } from "@xyflow/react";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";

import type { NodeProps } from "@xyflow/react";

export interface FunnelNodeData {
  label: string;
  onAddAfter?: (
    type?: "landing" | "funnelCheckout" | "order_confirmation",
  ) => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function FunnelNode({ data, selected }: NodeProps) {
  const d = data as FunnelNodeData;
  return (
    <div
      className={`rounded-2xl border bg-card px-6 py-5 shadow-sm ${selected ? "ring-2 ring-pink-400" : ""}`}
    >
      <NodeToolbar isVisible={Boolean(selected)} position={Position.Top}>
        <button
          type="button"
          aria-label="Edit step"
          onClick={d.onEdit}
          className="xy-theme__button mr-2"
        >
          Edit
        </button>
        <button
          type="button"
          aria-label="Delete step"
          onClick={d.onDelete}
          className="xy-theme__button text-red-600"
        >
          Delete
        </button>
      </NodeToolbar>
      <div className="text-lg font-semibold">{d.label}</div>
      <Handle id="in" type="target" position={Position.Top} />
      <Handle id="out" type="source" position={Position.Bottom} />
      <div className="mt-2 flex justify-center">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Add step below"
              className="rounded-md border px-2 py-1 text-lg leading-none"
            >
              +
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="center">
            <div className="flex flex-col gap-2">
              <button
                className="xy-theme__button"
                onClick={() => d.onAddAfter?.("landing")}
              >
                Landing Page
              </button>
              <button
                className="xy-theme__button"
                onClick={() => d.onAddAfter?.("funnelCheckout")}
              >
                Checkout
              </button>
              <button
                className="xy-theme__button"
                onClick={() => d.onAddAfter?.("order_confirmation")}
              >
                Order Confirmation
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
