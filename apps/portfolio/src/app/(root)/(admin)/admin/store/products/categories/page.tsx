"use client";

import type { ColumnDef } from "@tanstack/react-table";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Plus,
  Tag,
  Trash,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
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
import { toast } from "@acme/ui/toast";

import type {
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";

// Type definitions for the product category
interface ProductCategory {
  _id: Id<"productCategories">;
  name: string;
  slug: string;
  description?: string;
  parentId?: Id<"productCategories">;
  level: number;
  isActive: boolean;
  isVisible: boolean;
  metaTitle?: string;
  metaDescription?: string;
  children?: ProductCategory[];
  productCount?: number;
}

// Type for category form state
interface CategoryFormState {
  name: string;
  description: string;
  parentId: Id<"productCategories"> | null;
  isActive: boolean;
  isVisible: boolean;
  metaTitle: string;
  metaDescription: string;
}

// Type for edit form state
interface EditFormState extends CategoryFormState {
  categoryId: Id<"productCategories"> | null;
}

export default function CategoriesAdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  // State for dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // State for forms
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>({
    name: "",
    description: "",
    parentId: null,
    isActive: true,
    isVisible: true,
    metaTitle: "",
    metaDescription: "",
  });

  const [editForm, setEditForm] = useState<EditFormState>({
    categoryId: null,
    name: "",
    description: "",
    parentId: null,
    isActive: true,
    isVisible: true,
    metaTitle: "",
    metaDescription: "",
  });

  // Fetch categories tree
  const categoriesData =
    useQuery(api.ecommerce?.categories?.index?.getProductCategories, {}) ?? [];

  // Get flat list of all categories for the parent selector
  const allCategoriesData =
    useQuery(api.ecommerce?.categories?.index?.getProductCategories, {}) ?? [];

  // Map to add the missing productCount property and flatten for EntityList
  const categories = categoriesData.map((category: any) => ({
    ...category,
    productCount: 0, // Default to 0 since we don't have actual product counts
  }));

  const allCategories = allCategoriesData.map((category: any) => ({
    ...category,
    productCount: 0, // Default to 0 since we don't have actual product counts
  }));

  // Mutations
  const createCategory = useMutation(
    api.ecommerce?.categories?.index?.createCategory,
  );
  const updateCategory = useMutation(
    api.ecommerce?.categories?.index?.updateCategory,
  );
  const deleteCategory = useMutation(
    api.ecommerce?.categories?.index?.deleteCategory,
  );

  useEffect(() => {
    if (categories !== undefined) {
      setIsLoading(false);
    }
  }, [categories]);

  // Handler for creating a new category
  const handleCreateCategory = async () => {
    try {
      await createCategory({
        name: categoryForm.name,
        description: categoryForm.description ?? undefined,
        parentId: categoryForm.parentId ?? undefined,
        isActive: categoryForm.isActive,
        isVisible: categoryForm.isVisible,
        metaTitle: categoryForm.metaTitle ?? undefined,
        metaDescription: categoryForm.metaDescription ?? undefined,
      });

      // Reset form and close dialog
      setCategoryForm({
        name: "",
        description: "",
        parentId: null,
        isActive: true,
        isVisible: true,
        metaTitle: "",
        metaDescription: "",
      });
      setAddDialogOpen(false);
      toast.success("Category created successfully");
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category. Please try again.");
    }
  };

  // Handler for updating a category
  const handleUpdateCategory = async () => {
    if (!editForm.categoryId) return;

    try {
      await updateCategory({
        categoryId: editForm.categoryId,
        name: editForm.name,
        description: editForm.description ?? undefined,
        parentId: editForm.parentId ?? undefined,
        isActive: editForm.isActive,
        isVisible: editForm.isVisible,
        metaTitle: editForm.metaTitle ?? undefined,
        metaDescription: editForm.metaDescription ?? undefined,
      });

      setEditDialogOpen(false);
      toast.success("Category updated successfully");
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category. Please try again.");
    }
  };

  // Handler for deleting a category
  const handleDeleteCategory = async (categoryId: Id<"productCategories">) => {
    try {
      await deleteCategory({ categoryId });
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(
        "Failed to delete category. It may have subcategories or products assigned to it.",
      );
    }
  };

  // Handler for editing a category
  const handleEditClick = (category: ProductCategory) => {
    setEditForm({
      categoryId: category._id,
      name: category.name,
      description: category.description ?? "",
      parentId: category.parentId ?? null,
      isActive: category.isActive,
      isVisible: category.isVisible,
      metaTitle: category.metaTitle ?? "",
      metaDescription: category.metaDescription ?? "",
    });
    setEditDialogOpen(true);
  };

  // Handler for toggling category expansion
  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Define column configurations for EntityList
  const columns: ColumnDef<ProductCategory>[] = [
    {
      id: "name",
      header: "Category Name",
      accessorKey: "name",
      enableSorting: true,
      cell: ({ row }) => {
        const category = row.original;
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedCategories.has(category._id);
        const indentLevel = category.level || 0;

        return (
          <div className="flex items-center">
            <div
              style={{ marginLeft: `${indentLevel * 20}px` }}
              className="flex items-center"
            >
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-2 h-6 w-6 p-0"
                  onClick={() => toggleExpand(category._id)}
                >
                  {isExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </Button>
              )}
              <div>
                <div className="font-medium">{category.name}</div>
                <div className="text-sm text-muted-foreground">
                  {category.slug}
                </div>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      cell: ({ row }) => {
        const description = row.original.description;
        return description ? (
          <div className="max-w-xs truncate" title={description}>
            {description}
          </div>
        ) : (
          <span className="text-muted-foreground">No description</span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "isActive",
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex gap-2">
            <Badge variant={category.isActive ? "default" : "secondary"}>
              {category.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant={category.isVisible ? "outline" : "secondary"}>
              {category.isVisible ? "Visible" : "Hidden"}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "level",
      header: "Level",
      accessorKey: "level",
      enableSorting: true,
      cell: ({ row }) => {
        return <div className="text-center">{row.original.level}</div>;
      },
    },
    {
      id: "productCount",
      header: "Products",
      accessorKey: "productCount",
      enableSorting: true,
      cell: ({ row }) => {
        return (
          <div className="text-center">{row.original.productCount || 0}</div>
        );
      },
    },
  ];

  // Define filters for EntityList
  const filters: FilterConfig<ProductCategory>[] = [
    {
      id: "status",
      label: "Status",
      type: "select",
      field: "isActive",
      options: [
        { label: "Active", value: true },
        { label: "Inactive", value: false },
      ],
    },
    {
      id: "visibility",
      label: "Visibility",
      type: "select",
      field: "isVisible",
      options: [
        { label: "Visible", value: true },
        { label: "Hidden", value: false },
      ],
    },
    {
      id: "level",
      label: "Level",
      type: "select",
      field: "level",
      options: [
        { label: "Level 0", value: 0 },
        { label: "Level 1", value: 1 },
        { label: "Level 2", value: 2 },
        { label: "Level 3", value: 3 },
      ],
    },
  ];

  // Define entity actions for EntityList
  const entityActions: EntityAction<ProductCategory>[] = [
    {
      id: "edit",
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditClick,
      variant: "outline",
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash className="h-4 w-4" />,
      onClick: (category: ProductCategory) => {
        if (
          confirm(
            "Are you sure you want to delete this category? This action cannot be undone.",
          )
        ) {
          handleDeleteCategory(category._id);
        }
      },
      variant: "outline",
      isDisabled: (category: ProductCategory) => {
        // Disable delete if category has children
        return !!(category.children && category.children.length > 0);
      },
    },
  ];

  // Header actions
  const headerActions = (
    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>Create a new product category</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Category name"
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm({
                  ...categoryForm,
                  name: e.target.value,
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Category description"
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm({
                  ...categoryForm,
                  description: e.target.value,
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="parent">Parent Category</Label>
            <Select
              value={categoryForm.parentId ?? ""}
              onValueChange={(value) =>
                setCategoryForm({
                  ...categoryForm,
                  parentId: value ? (value as Id<"productCategories">) : null,
                })
              }
            >
              <SelectTrigger id="parent">
                <SelectValue placeholder="Select a parent category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None (Root Category)</SelectItem>
                {allCategories.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={categoryForm.isActive}
                onCheckedChange={(checked) =>
                  setCategoryForm({
                    ...categoryForm,
                    isActive: checked === true,
                  })
                }
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isVisible"
                checked={categoryForm.isVisible}
                onCheckedChange={(checked) =>
                  setCategoryForm({
                    ...categoryForm,
                    isVisible: checked === true,
                  })
                }
              />
              <Label htmlFor="isVisible">Visible</Label>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="metaTitle">Meta Title (SEO)</Label>
            <Input
              id="metaTitle"
              placeholder="Meta title"
              value={categoryForm.metaTitle}
              onChange={(e) =>
                setCategoryForm({
                  ...categoryForm,
                  metaTitle: e.target.value,
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
            <Textarea
              id="metaDescription"
              placeholder="Meta description"
              value={categoryForm.metaDescription}
              onChange={(e) =>
                setCategoryForm({
                  ...categoryForm,
                  metaDescription: e.target.value,
                })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateCategory}>Create Category</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container py-6">
      <EntityList<ProductCategory>
        data={categories}
        columns={columns}
        filters={filters}
        isLoading={isLoading}
        title="Product Categories"
        description="Organize your products with hierarchical categories"
        entityActions={entityActions}
        actions={headerActions}
        defaultViewMode="list"
        viewModes={["list"]}
        emptyState={
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Tag className="mb-2 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-1 text-lg font-medium">No categories found</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Get started by creating your first product category
            </p>
            <Button onClick={() => setAddDialogOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        }
        enableSearch={true}
      />

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update this product category</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="Category name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Category description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-parent">Parent Category</Label>
              <Select
                value={editForm.parentId ?? ""}
                onValueChange={(value) =>
                  setEditForm({
                    ...editForm,
                    parentId: value ? (value as Id<"productCategories">) : null,
                  })
                }
              >
                <SelectTrigger id="edit-parent">
                  <SelectValue placeholder="Select a parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Root Category)</SelectItem>
                  {allCategories
                    .filter((cat) => cat._id !== editForm.categoryId)
                    .map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isActive"
                  checked={editForm.isActive}
                  onCheckedChange={(checked) =>
                    setEditForm({
                      ...editForm,
                      isActive: checked === true,
                    })
                  }
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isVisible"
                  checked={editForm.isVisible}
                  onCheckedChange={(checked) =>
                    setEditForm({
                      ...editForm,
                      isVisible: checked === true,
                    })
                  }
                />
                <Label htmlFor="edit-isVisible">Visible</Label>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-metaTitle">Meta Title (SEO)</Label>
              <Input
                id="edit-metaTitle"
                placeholder="Meta title"
                value={editForm.metaTitle}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    metaTitle: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-metaDescription">
                Meta Description (SEO)
              </Label>
              <Textarea
                id="edit-metaDescription"
                placeholder="Meta description"
                value={editForm.metaDescription}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    metaDescription: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory}>Update Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
