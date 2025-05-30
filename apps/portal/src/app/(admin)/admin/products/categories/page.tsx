"use client";

import React, { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ChevronDown, ChevronRight, Edit, Plus, Trash } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { Textarea } from "@acme/ui/textarea";

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
  productCount: number;
  children?: ProductCategory[];
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
  // State for dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

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
  const categoryTree =
    useQuery(api.ecommerce.getCategoryTree, {
      includeInactive: true,
      includeInvisible: true,
    }) ?? [];

  // Get flat list of all categories for the parent selector
  const allCategories =
    useQuery(api.ecommerce.categories.index.getProductCategories, {
      includeInactive: true,
      includeInvisible: true,
    }) ?? [];

  // Mutations
  const createCategory = useMutation(api.ecommerce.createProductCategory);
  const updateCategory = useMutation(api.ecommerce.updateProductCategory);
  const deleteCategory = useMutation(api.ecommerce.deleteProductCategory);

  // Handler for creating a new category
  const handleCreateCategory = async () => {
    try {
      await createCategory({
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        parentId: categoryForm.parentId || undefined,
        isActive: categoryForm.isActive,
        isVisible: categoryForm.isVisible,
        metaTitle: categoryForm.metaTitle || undefined,
        metaDescription: categoryForm.metaDescription || undefined,
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
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category. Please try again.");
    }
  };

  // Handler for updating a category
  const handleUpdateCategory = async () => {
    if (!editForm.categoryId) return;

    try {
      await updateCategory({
        categoryId: editForm.categoryId,
        name: editForm.name,
        description: editForm.description || undefined,
        parentId: editForm.parentId || undefined,
        isActive: editForm.isActive,
        isVisible: editForm.isVisible,
        metaTitle: editForm.metaTitle || undefined,
        metaDescription: editForm.metaDescription || undefined,
      });

      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category. Please try again.");
    }
  };

  // Handler for deleting a category
  const handleDeleteCategory = async (categoryId: Id<"productCategories">) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await deleteCategory({ categoryId });
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(
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

  // Recursive function to render categories
  const renderCategories = (categories: ProductCategory[], level = 0) => {
    return categories.map((category) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.has(category._id);

      return (
        <React.Fragment key={category._id}>
          <TableRow>
            <TableCell className="w-12">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => toggleExpand(category._id)}
                >
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </Button>
              )}
            </TableCell>
            <TableCell className={`pl-${level * 4}`}>
              <div className="font-medium">{category.name}</div>
              <div className="text-sm text-muted-foreground">
                {category.slug}
              </div>
            </TableCell>
            <TableCell>
              {category.isActive ? (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  Inactive
                </span>
              )}
            </TableCell>
            <TableCell>
              {category.isVisible ? (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  Visible
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  Hidden
                </span>
              )}
            </TableCell>
            <TableCell>{category.level}</TableCell>
            <TableCell className="space-x-2 text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditClick(category)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteCategory(category._id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
          {hasChildren && isExpanded && (
            <>{renderCategories(category.children!, level + 1)}</>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="container p-6">
      <h1 className="mb-6 text-3xl font-bold">Product Categories</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Manage your product category hierarchy
            </CardDescription>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a new product category
                </DialogDescription>
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
                    value={categoryForm.parentId || ""}
                    onValueChange={(value) =>
                      setCategoryForm({
                        ...categoryForm,
                        parentId: value
                          ? (value as Id<"productCategories">)
                          : null,
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
                          isActive: !!checked,
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
                          isVisible: !!checked,
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
                  <Label htmlFor="metaDescription">
                    Meta Description (SEO)
                  </Label>
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
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateCategory}>Create Category</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderCategories(categoryTree)}</TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
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
                value={editForm.parentId || ""}
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
                      isActive: !!checked,
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
                      isVisible: !!checked,
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
