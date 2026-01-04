"use client";

import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";

export type SignatureFieldElement = {
  id: string;
  pageIndex: number;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  required: boolean;
  label?: string;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export const SignatureInspector = ({
  element,
  pageSize,
  onChange,
  onRemove,
}: {
  element: SignatureFieldElement | null;
  pageSize: { width: number; height: number };
  onChange: (patch: Partial<SignatureFieldElement>) => void;
  onRemove: () => void;
}) => {
  if (!element) {
    return (
      <div className="text-muted-foreground rounded-md border p-3 text-xs">
        Select a field on the canvas to edit it.
      </div>
    );
  }

  const x = Math.round(element.xPct * pageSize.width);
  const y = Math.round(element.yPct * pageSize.height);
  const w = Math.round(element.wPct * pageSize.width);
  const h = Math.round(element.hPct * pageSize.height);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-muted-foreground text-xs font-semibold uppercase">
          Selected field
        </Label>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-medium underline underline-offset-4"
        >
          Remove
        </button>
      </div>

      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs font-semibold uppercase">
          Label
        </Label>
        <Input
          value={element.label ?? ""}
          onChange={(e) => onChange({ label: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-sm">Required</div>
          <div className="text-muted-foreground text-xs">
            Recipient must sign this field.
          </div>
        </div>
        <Switch
          checked={Boolean(element.required)}
          onCheckedChange={(v) => onChange({ required: Boolean(v) })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs font-semibold uppercase">
            X
          </Label>
          <Input
            value={String(x)}
            onChange={(e) =>
              onChange({
                xPct: clamp01((Number(e.target.value) || 0) / pageSize.width),
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs font-semibold uppercase">
            Y
          </Label>
          <Input
            value={String(y)}
            onChange={(e) =>
              onChange({
                yPct: clamp01((Number(e.target.value) || 0) / pageSize.height),
              })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs font-semibold uppercase">
            Width
          </Label>
          <Input
            value={String(w)}
            onChange={(e) =>
              onChange({
                wPct: clamp01((Number(e.target.value) || 0) / pageSize.width),
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs font-semibold uppercase">
            Height
          </Label>
          <Input
            value={String(h)}
            onChange={(e) =>
              onChange({
                hPct: clamp01((Number(e.target.value) || 0) / pageSize.height),
              })
            }
          />
        </div>
      </div>
    </div>
  );
};













