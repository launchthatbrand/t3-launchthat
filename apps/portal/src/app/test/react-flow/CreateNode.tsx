"use client";

import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";

import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";

import type { CreateData, RouterKind } from "./types";

export default function CreateNode({ id, data }: NodeProps) {
  const d = data as unknown as CreateData;
  const disabled = d.prevId == null;
  const handlePick = (kind: RouterKind) => {
    if (typeof d.prevId === "string") d.onCreate?.(d.prevId, String(id), kind);
  };
  return (
    <div className="rounded border-2 border-dashed bg-white px-3 py-2 text-sm shadow-sm transition-opacity transition-transform duration-300 ease-out">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="rounded-sm border bg-white px-2 py-1 text-xs shadow"
              disabled={disabled}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              +
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-2">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="xy-theme__button"
                onClick={() => handlePick("checkout")}
              >
                Checkout
              </button>
              <button
                type="button"
                className="xy-theme__button"
                onClick={() => handlePick("order_confirmation")}
              >
                Order Confirmation
              </button>
              <button
                type="button"
                className="xy-theme__button"
                onClick={() => handlePick("upsell")}
              >
                Upsell
              </button>
              <button
                type="button"
                className="xy-theme__button"
                onClick={() => handlePick("router")}
              >
                Router
              </button>
            </div>
          </PopoverContent>
        </Popover>
        <span>Add next step</span>
      </div>
      <Handle type="target" position={Position.Top} />
    </div>
  );
}
