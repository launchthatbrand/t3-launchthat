"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { Checkbox } from "@acme/ui/checkbox";
import type { Doc } from "@/convex/_generated/dataModel";
import { Label } from "@acme/ui/label";
import React from "react";

interface ProductSettingsProps {
  product: Doc<"products">;
  onUpdate: (updates: Partial<Doc<"products">>) => Promise<void>;
  isSubmitting: boolean;
}

export function ProductSettings({
  product,
  onUpdate,
  isSubmitting,
}: ProductSettingsProps) {
  const handleStatusChange = async (
    status: "draft" | "active" | "archived",
  ) => {
    await onUpdate({ status });
  };

  const handleCheckboxChange = async (
    field: keyof Doc<"products">,
    checked: boolean,
  ) => {
    await onUpdate({ [field]: checked });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Settings</CardTitle>
        <CardDescription>
          Configure product visibility and type settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={product.status}
            onValueChange={handleStatusChange}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isVisible"
              checked={product.isVisible}
              onCheckedChange={(checked) =>
                handleCheckboxChange("isVisible", !!checked)
              }
              disabled={isSubmitting}
            />
            <Label htmlFor="isVisible">Visible in store</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDigital"
              checked={product.isDigital}
              onCheckedChange={(checked) =>
                handleCheckboxChange("isDigital", !!checked)
              }
              disabled={isSubmitting}
            />
            <Label htmlFor="isDigital">Digital product</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasVariants"
              checked={product.hasVariants}
              onCheckedChange={(checked) =>
                handleCheckboxChange("hasVariants", !!checked)
              }
              disabled={isSubmitting}
            />
            <Label htmlFor="hasVariants">Has variants</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="taxable"
              checked={product.taxable}
              onCheckedChange={(checked) =>
                handleCheckboxChange("taxable", !!checked)
              }
              disabled={isSubmitting}
            />
            <Label htmlFor="taxable">Taxable</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFeatured"
              checked={product.isFeatured}
              onCheckedChange={(checked) =>
                handleCheckboxChange("isFeatured", !!checked)
              }
              disabled={isSubmitting}
            />
            <Label htmlFor="isFeatured">Featured product</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
