"use client";

import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@acme/ui/context-menu";

import type { ToolbarData } from "./types";

export default function NodeWithContextMenu({ id, data }: NodeProps) {
  const d = data as unknown as ToolbarData;
  const isFirst = id === "1";
  const canDelete = !d.isSystem;
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="rounded border bg-white px-3 py-2 shadow-sm transition-opacity transition-transform duration-300 ease-out">
          <div className="text-sm">{d.label}</div>
          {!isFirst && <Handle type="target" position={Position.Top} />}
          <Handle type="source" position={Position.Bottom} />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {d.onAddRoute && (
          <>
            <ContextMenuItem onClick={() => d.onAddRoute?.(String(id))}>
              Add route
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        {canDelete && (
          <ContextMenuItem onClick={() => d.onDelete?.(String(id))}>
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
