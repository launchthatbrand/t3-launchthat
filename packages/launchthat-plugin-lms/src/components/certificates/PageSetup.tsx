"use client";

import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import type { CertificateOrientation, CertificatePageSize } from "./types";

export const PageSetup = ({
  size,
  orientation,
  onChange,
}: {
  size: CertificatePageSize;
  orientation: CertificateOrientation;
  onChange: (next: {
    size: CertificatePageSize;
    orientation: CertificateOrientation;
  }) => void;
}) => {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs font-semibold uppercase">
          Page size
        </Label>
        <Select
          value={size}
          onValueChange={(value) =>
            onChange({ size: value as CertificatePageSize, orientation })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="letter">Letter</SelectItem>
            <SelectItem value="a4">A4</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs font-semibold uppercase">
          Orientation
        </Label>
        <Select
          value={orientation}
          onValueChange={(value) =>
            onChange({ size, orientation: value as CertificateOrientation })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="landscape">Landscape</SelectItem>
            <SelectItem value="portrait">Portrait</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
