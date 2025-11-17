"use client";

import React, { useState } from "react";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";
import { FilePlus, Pencil, Trash } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";
import { useTenant } from "~/context/TenantContext";

// Since the current implementation uses a simple string for category
// We'll create a more structured interface for future expansion
interface CategoryFormData {
  name: string;
  description: string;
}

export default function CategoryAdminPage() {
  // State for dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // State for forms
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: "",
    description: "",
  });

  // State for editing
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const tenant = useTenant();
  // Get categories data
  const categories = useQuery(
    api.core.posts.queries.getPostCategories,
    tenant?._id ? { organizationId: tenant._id } : {},
  );
  const isLoading = categories === undefined;

  // Function to refresh categories list
  // const refreshCategories = () => {
  //   window.location.reload();
  // };

  // Function to handle adding a new category
  const handleAddCategory = () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      toast.success(`Category "${categoryForm.name}" created successfully`);

      // This is just a prototype UI - actual API not yet integrated
      toast.info("Note: Category management API is still in development");

      // Reset form and close dialog
      setCategoryForm({ name: "", description: "" });
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category. API not yet available.");
    }
  };

  // Function to handle editing a category
  const handleEditCategory = (categoryName: string) => {
    setEditingCategory(categoryName);
    setCategoryForm({
      name: categoryName,
      description: "", // We don't have descriptions yet in the current schema
    });
    setEditDialogOpen(true);
  };

  // Function to submit category edits
  const handleUpdateCategory = () => {
    if (!categoryForm.name.trim() || !editingCategory) {
      toast.error("Category name is required");
      return;
    }

    try {
      toast.success(
        `Category "${editingCategory}" updated to "${categoryForm.name}"`,
      );
      toast.info("Note: Category management API is still in development");

      // Reset form and close dialog
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "" });
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category. API not yet available.");
    }
  };

  // Function to handle deleting a category
  const handleDeleteCategory = (categoryName: string) => {
    // Confirm delete
    if (
      !window.confirm(
        `Are you sure you want to delete "${categoryName}"? This will move all its posts to "Uncategorized".`,
      )
    ) {
      return;
    }

    try {
      toast.success(`Category "${categoryName}" deleted successfully.`);
      toast.info("Note: Category management API is still in development");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category. API not yet available.");
    }
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Blog Categories</h1>
        <p className="text-muted-foreground">
          Manage categories for your blog posts
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Organize your blog posts with categories
            </CardDescription>
          </div>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <FilePlus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a new category for your blog posts
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
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
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
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddCategory}>Add Category</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>
                  Update the category details
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="Category name"
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="edit-description"
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
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateCategory}>Update Category</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-muted-foreground">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <h3 className="mb-2 text-xl font-medium">No categories found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Add your first category to organize blog posts
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <FilePlus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Post Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.name || "unnamed"}>
                    <TableCell className="font-medium">
                      {category.name || "Unnamed Category"}
                    </TableCell>
                    <TableCell>{category.postTypes?.length ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category.name || "")}
                        className="mr-2"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteCategory(category.name || "")
                        }
                        disabled={category.name === "Uncategorized"}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t px-6 py-4">
          <p className="text-sm text-muted-foreground">
            {categories ? categories.length : 0} categories
          </p>
          <div className="text-sm text-muted-foreground">
            <span className="italic">
              Note: Category management API is in development
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
