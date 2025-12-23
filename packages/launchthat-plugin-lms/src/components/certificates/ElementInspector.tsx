"use client";

import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import type {
  CertificateElement,
  CertificatePlaceholderKey,
  CertificateTextAlign,
} from "./types";
import { PLACEHOLDER_LABELS } from "./types";

export const ElementInspector = ({
  element,
  onChange,
  onRemove,
  canvas,
}: {
  element: CertificateElement | null;
  onChange: (patch: Partial<CertificateElement>) => void;
  onRemove: () => void;
  canvas?: { width: number; height: number };
}) => {
  if (!element) {
    return (
      <div className="text-muted-foreground rounded-md border p-3 text-xs">
        Select a placeholder on the canvas to edit it.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-muted-foreground text-xs font-semibold uppercase">
          Selected element
        </Label>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-medium underline underline-offset-4"
        >
          Remove
        </button>
      </div>

      {element.kind === "placeholder" ? (
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs font-semibold uppercase">
            Placeholder
          </Label>
          <Select
            value={element.placeholderKey}
            onValueChange={(value) =>
              onChange({
                placeholderKey: value as CertificatePlaceholderKey,
              } as any)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PLACEHOLDER_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs font-semibold uppercase">
            X
          </Label>
          <Input
            value={String(Math.round(element.x))}
            onChange={(e) =>
              onChange({ x: Number(e.target.value) || 0 } as any)
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs font-semibold uppercase">
            Y
          </Label>
          <Input
            value={String(Math.round(element.y))}
            onChange={(e) =>
              onChange({ y: Number(e.target.value) || 0 } as any)
            }
          />
        </div>
      </div>

      {element.kind === "placeholder" ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs font-semibold uppercase">
              Font size
            </Label>
            <Input
              value={String(element.style.fontSize)}
              onChange={(e) =>
                onChange({
                  style: {
                    ...element.style,
                    fontSize: Number(e.target.value) || element.style.fontSize,
                  },
                } as any)
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs font-semibold uppercase">
              Color
            </Label>
            <Input
              type="color"
              value={element.style.color}
              onChange={(e) =>
                onChange({
                  style: { ...element.style, color: e.target.value },
                } as any)
              }
            />
          </div>
        </div>
      ) : null}

      {element.kind === "placeholder" ? (
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs font-semibold uppercase">
            Align
          </Label>
          <Select
            value={element.style.align}
            onValueChange={(value) =>
              onChange({
                style: {
                  ...element.style,
                  align: value as CertificateTextAlign,
                },
              } as any)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs font-semibold uppercase">
            Width
          </Label>
          <Input
            value={String(Math.round(element.width))}
            onChange={(e) =>
              onChange({
                width: Number(e.target.value) || element.width,
              } as any)
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs font-semibold uppercase">
            Height
          </Label>
          <Input
            value={String(Math.round(element.height))}
            onChange={(e) =>
              onChange({
                height: Number(e.target.value) || element.height,
              } as any)
            }
          />
        </div>
      </div>

      {"rotation" in element ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs font-semibold uppercase">
              Rotation
            </Label>
            <Input
              value={String(Math.round((element as any).rotation ?? 0))}
              onChange={(e) =>
                onChange({ rotation: Number(e.target.value) || 0 } as any)
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs font-semibold uppercase">
              Layer (z)
            </Label>
            <Input
              value={String(Math.round((element as any).zIndex ?? 0))}
              onChange={(e) =>
                onChange({ zIndex: Number(e.target.value) || 0 } as any)
              }
            />
          </div>
        </div>
      ) : null}

      {element.kind === "image" && canvas ? (
        <button
          type="button"
          className="text-xs font-medium underline underline-offset-4"
          onClick={() =>
            onChange({
              x: 0,
              y: 0,
              width: canvas.width,
              height: canvas.height,
            } as any)
          }
        >
          Fit image to canvas
        </button>
      ) : null}
    </div>
  );
};
