"use client";

import React, { useState } from "react";
import { api } from "@portal/convexspec";
import { useMutation } from "convex/react";
import { Id } from "src/lib/types";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Textarea } from "@acme/ui/textarea";

// Pricing input with automatic conversion to cents
const PriceInput = ({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  placeholder?: string;
}) => {
  // Convert cents to dollars for display
  const displayValue = (value / 100).toFixed(2);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert dollars to cents when storing
    const dollarValue = parseFloat(e.target.value) || 0;
    onChange(Math.round(dollarValue * 100));
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={label.toLowerCase().replace(/\s/g, "-")}>{label}</Label>
      <div className="relative">
        <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
          $
        </span>
        <Input
          id={label.toLowerCase().replace(/\s/g, "-")}
          type="number"
          min="0"
          step="0.01"
          className="pl-7"
          placeholder={placeholder ?? "0.00"}
          value={displayValue}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

interface ProductFormProps {
  initialData?: {
    _id?: Id<"products">;
    name: string;
    description?: string;
    priceInCents: number;
    isPublished?: boolean;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProductForm({
  initialData,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  // Mutations
  const createProduct = useMutation(
    api.ecommerce.products.mutations.createProduct,
  );
  const updateProduct = useMutation(
    api.ecommerce.products.mutations.updateProduct,
  );

  // Form state
  const [formData, setFormData] = useState({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    priceInCents: initialData?.priceInCents ?? 0,
    isPublished: initialData?.isPublished ?? false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (formData.priceInCents <= 0)
      newErrors.priceInCents = "Price must be greater than 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (initialData?._id) {
        // Update existing product
        await updateProduct({
          productId: initialData._id,
          name: formData.name,
          description: formData.description,
        });
      } else {
        // Create new product
        await createProduct({
          name: formData.name,
          description: formData.description,
          basePrice: formData.priceInCents,
          categoryIds: [],
          images: [],
          hasVariants: false,
          isDigital: false,
          taxable: true,
          isVisible: true,
          sku: "",
          status: "draft",
        });
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter product name"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detailed product description"
              rows={6}
            />
          </div>
        </div>

        {/* Pricing & Status */}
        <div className="space-y-4">
          <div className="grid gap-4">
            <PriceInput
              label="Price"
              value={formData.priceInCents}
              onChange={(value) =>
                setFormData({ ...formData, priceInCents: value })
              }
              placeholder="0.00"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.isPublished ? "published" : "draft"}
              onValueChange={(value) =>
                setFormData({ ...formData, isPublished: value === "published" })
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : initialData?._id
              ? "Update Product"
              : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
