"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import type { Id } from "@/convex/_generated/dataModel";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";

// Define product data interfaces
export interface ProductFormData {
  name: string;
  description: string;
  shortDescription?: string;
  basePrice: number;
  salePrice?: number;
  costPrice?: number;
  sku: string;
  inventoryLevel?: number;
  primaryCategoryId: Id<"productCategories">;
  categoryIds: Id<"productCategories">[];
  status: "draft" | "active" | "archived";
  isVisible: boolean;
  isDigital: boolean;
  hasVariants: boolean;
  images: Array<{
    url: string;
    alt?: string;
    position?: number;
    isPrimary?: boolean;
  }>;
  taxable: boolean;
  isFeatured: boolean;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

export interface ProductData extends ProductFormData {
  _id: Id<"products">;
  _creationTime: number;
  slug: string;
  createdAt: number;
  updatedAt: number;
  priceInCents?: number;
  price?: number;
  stockQuantity?: number;
}

// ProductForm props
interface ProductFormProps {
  initialData?: Partial<ProductData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isSubmitting: boolean;
  categories: Array<{
    _id: Id<"productCategories">;
    name: string;
  }>;
  submitButtonText?: string;
}

export default function ProductForm({
  initialData,
  onSubmit,
  isSubmitting,
  categories,
  submitButtonText = "Save Product",
}: ProductFormProps) {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    price: 0,
    sku: "",
    primaryCategoryId: "",
    status: "draft" as "draft" | "active" | "archived",
    isVisible: false,
    isDigital: false,
    hasVariants: false,
    taxable: true,
    isFeatured: false,
  });

  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name ?? "",
        description: initialData.description ?? "",
        shortDescription: initialData.shortDescription ?? "",
        // Convert price from cents to dollars for display
        price: initialData.price ?? (initialData.priceInCents ?? 0) / 100,
        sku: initialData.sku ?? "",
        primaryCategoryId: initialData.primaryCategoryId ?? "",
        status: initialData.status ?? "draft",
        isVisible: initialData.isVisible ?? false,
        isDigital: initialData.isDigital ?? false,
        hasVariants: initialData.hasVariants ?? false,
        taxable: initialData.taxable ?? true,
        isFeatured: initialData.isFeatured ?? false,
      });
    }
  }, [initialData]);

  // Form handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure we have a valid category ID
    if (!formData.primaryCategoryId) {
      alert("Please select a category");
      return;
    }

    // Convert price from dollars to cents
    const priceInCents = Math.round(
      parseFloat(formData.price.toString()) * 100,
    );

    await onSubmit({
      name: formData.name,
      description: formData.description,
      shortDescription: formData.shortDescription || undefined,
      basePrice: priceInCents,
      sku: formData.sku,
      primaryCategoryId: formData.primaryCategoryId as Id<"productCategories">,
      categoryIds: [formData.primaryCategoryId as Id<"productCategories">],
      status: formData.status,
      isVisible: formData.isVisible,
      isDigital: formData.isDigital,
      hasVariants: formData.hasVariants,
      images: initialData?.images ?? [],
      taxable: formData.taxable,
      isFeatured: formData.isFeatured,
      tags: initialData?.tags ?? [],
      metaTitle: initialData?.metaTitle,
      metaDescription: initialData?.metaDescription,
      metaKeywords: initialData?.metaKeywords,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the essential details for your product.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Product Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                name="shortDescription"
                placeholder="Brief description (displayed in listings)"
                value={formData.shortDescription}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detailed product description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                name="sku"
                placeholder="Stock Keeping Unit"
                value={formData.sku}
                onChange={handleChange}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Categorization */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Categorization</CardTitle>
            <CardDescription>
              Set the product price and category.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryCategoryId">Primary Category *</Label>
              <Select
                value={formData.primaryCategoryId}
                onValueChange={(value) =>
                  handleSelectChange("primaryCategoryId", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isVisible"
                checked={formData.isVisible}
                onCheckedChange={(checked: boolean) =>
                  handleCheckboxChange("isVisible", checked)
                }
              />
              <Label htmlFor="isVisible">Visible in store</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDigital"
                checked={formData.isDigital}
                onCheckedChange={(checked: boolean) =>
                  handleCheckboxChange("isDigital", checked)
                }
              />
              <Label htmlFor="isDigital">Digital product</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="taxable"
                checked={formData.taxable}
                onCheckedChange={(checked: boolean) =>
                  handleCheckboxChange("taxable", checked)
                }
              />
              <Label htmlFor="taxable">Taxable</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFeatured"
                checked={formData.isFeatured}
                onCheckedChange={(checked: boolean) =>
                  handleCheckboxChange("isFeatured", checked)
                }
              />
              <Label htmlFor="isFeatured">Featured product</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end space-x-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitButtonText}
        </Button>
      </div>
    </form>
  );
}
