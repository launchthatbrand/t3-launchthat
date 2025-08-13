"use client";

import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import type { RouteEdgeData, RouterKind } from "./types";

import type { EdgeProps } from "@xyflow/react";
import { GearIcon } from "@radix-ui/react-icons";

export default function PlusEdgeWithPopover(props: EdgeProps) {
  const {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    data,
  } = props;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const d = data as unknown as RouteEdgeData;
  const handlePick = (kind: RouterKind) =>
    d.onInsert?.(String(source), String(target), kind);
  const isConfig = Boolean(
    d.isRouteConfigEdge && d.routerId && d.routeId && d.setRoutePercentage,
  );

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        {isConfig ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Configure route"
                className="rounded-sm border bg-white p-1 shadow"
                style={{
                  position: "absolute",
                  transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                  pointerEvents: "all",
                }}
              >
                <GearIcon className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-60 p-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs">Traffic %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={0}
                  className="h-7 w-20 rounded border px-2 text-sm"
                  onChange={(e) =>
                    d.setRoutePercentage?.(
                      String(d.routerId),
                      String(d.routeId),
                      Number(e.currentTarget.value || 0),
                    )
                  }
                />
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                Does not auto-normalize (yet).
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="rounded-sm border bg-white px-2 py-1 text-xs shadow"
                style={{
                  position: "absolute",
                  transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                  pointerEvents: "all",
                }}
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
        )}
      </EdgeLabelRenderer>
    </>
  );
}
