"use client";

import { Button } from "@acme/ui/button";
import { Label } from "@acme/ui/label";

export const SignaturePalette = ({ onAdd }: { onAdd: () => void }) => {
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground text-xs font-semibold uppercase">
        Fields
      </Label>
      <div className="grid grid-cols-1 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="justify-start"
        >
          Signature
        </Button>
      </div>
    </div>
  );
};









