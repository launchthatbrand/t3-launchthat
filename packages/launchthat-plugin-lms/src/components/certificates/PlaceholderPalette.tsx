"use client";

import { Button } from "@acme/ui/button";
import { Label } from "@acme/ui/label";

import type { CertificatePlaceholderKey } from "./types";
import { PLACEHOLDER_LABELS } from "./types";

const DEFAULT_KEYS: CertificatePlaceholderKey[] = [
  "userName",
  "completionDate",
  "courseTitle",
  "certificateId",
  "organizationName",
];

export const PlaceholderPalette = ({
  onAdd,
}: {
  onAdd: (key: CertificatePlaceholderKey) => void;
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase text-muted-foreground">
        Placeholders
      </Label>
      <div className="grid grid-cols-1 gap-2">
        {DEFAULT_KEYS.map((key) => (
          <Button
            key={key}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAdd(key)}
            className="justify-start"
          >
            {PLACEHOLDER_LABELS[key]}
          </Button>
        ))}
      </div>
    </div>
  );
};


