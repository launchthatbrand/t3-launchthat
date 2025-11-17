"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { CalendarDays, FilePlus, Pencil, Trash } from "lucide-react";

import { Button } from "@acme/ui/button";
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
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import type { Id } from "../../../../../../../convex/_generated/dataModel";
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import { api } from "../../../../../../../convex/_generated/api";

// Category form data interface
interface CategoryFormData {
  name: string;
  description: string;
  isPublic: boolean;
  color: string;
}

// Modified to use a string ID instead of Id<"eventCategories">
interface CalendarCategoryItem {
  _id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  color?: string;
  _creationTime: number;
  createdAt: number;
}

export default function CalendarCategoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const ensureUser = useMutation(api.core.users.createOrGetUser);

  // Early return if auth is loading or user is not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("You must be logged in to access this page.");
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="container p-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Authenticating...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // This state should ideally be brief due to the useEffect redirect,
    // but it's a safeguard.
    return (
      <div className="container p-8">
        <p className="text-center text-muted-foreground">
          Redirecting to login...
        </p>
      </div>
    );
  }

  // At this point, isAuthenticated is true and authLoading is false.
  // We can now safely call hooks that depend on authentication.
  return <AuthenticatedCategoryPage ensureUser={ensureUser} router={router} />;
}

function AuthenticatedCategoryPage({
  ensureUser,
  router,
}: {
  ensureUser: ReturnType<
    typeof useMutation<typeof api.core.users.mutations.createOrGetUser>
  >;
  router: ReturnType<typeof useRouter>;
}) {
  const isAdminResult = useQuery(api.core.accessControl.queries.checkIsAdmin);

  useEffect(() => {
    ensureUser().catch((error) => {
      console.error("Failed to ensure user exists:", error);
      toast.error("Error verifying user session. Please try logging in again.");
    });
  }, [ensureUser]);

  useEffect(() => {
    if (isAdminResult === false) {
      toast.error("You are not authorized to view this page.");
      router.push("/dashboard");
    }
  }, [isAdminResult, router]);

  if (isAdminResult === undefined) {
    return (
      <div className="container p-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Verifying admin status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAdminResult === false) {
    return (
      <div className="container p-8">
        <p className="text-center text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  // At this point, isAdminResult is true.
  return <CategoryContent router={router} />;
}

function CategoryContent({ router }: { router: ReturnType<typeof useRouter> }) {
  // Dialogs state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CalendarCategoryItem | null>(null);

  // Form state
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: "",
    description: "",
    isPublic: true,
    color: "#4287f5", // Default blue color
  });

  // Editing state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );

  // Use static mock data since the API endpoints don't exist yet
  // This avoids the TypeScript errors with non-existent API endpoints
  const [categories, setCategories] = useState<CalendarCategoryItem[]>([
    {
      _id: "mock-1",
      name: "Meetings",
      description: "Regular team meetings and check-ins",
      isPublic: true,
      color: "#4287f5",
      _creationTime: Date.now() - 1000000,
      createdAt: Date.now() - 1000000,
    },
    {
      _id: "mock-2",
      name: "Workshops",
      description: "Interactive learning sessions and workshops",
      isPublic: true,
      color: "#42b883",
      _creationTime: Date.now() - 2000000,
      createdAt: Date.now() - 2000000,
    },
    {
      _id: "mock-3",
      name: "Deadlines",
      description: "Project milestones and important deadlines",
      isPublic: false,
      color: "#f54242",
      _creationTime: Date.now() - 3000000,
      createdAt: Date.now() - 3000000,
    },
  ]);

  // Mock API functions using state management
  const [isLoading, setIsLoading] = useState(false);

  // Handle adding a new category
  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setIsLoading(true);
      // Mock API call
      setTimeout(() => {
        const newCategory: CalendarCategoryItem = {
          _id: `mock-${Date.now()}`,
          name: categoryForm.name,
          description: categoryForm.description,
          isPublic: categoryForm.isPublic,
          color: categoryForm.color,
          _creationTime: Date.now(),
          createdAt: Date.now(),
        };

        setCategories((prev) => [...prev, newCategory]);
        setIsLoading(false);

        toast.success(`Category "${categoryForm.name}" created successfully`);

        // Reset form and close dialog
        setCategoryForm({
          name: "",
          description: "",
          isPublic: true,
          color: "#4287f5",
        });
        setAddDialogOpen(false);
      }, 500);
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
      setIsLoading(false);
    }
  };

  // Function to handle editing a category
  const handleEditCategory = (category: CalendarCategoryItem) => {
    setEditingCategoryId(category._id);
    setCategoryForm({
      name: category.name,
      description: category.description ?? "",
      isPublic: category.isPublic,
      color: category.color ?? "#4287f5",
    });
    setEditDialogOpen(true);
  };

  // Function to submit category edits
  const handleUpdateCategory = async () => {
    if (!categoryForm.name.trim() || !editingCategoryId) {
      toast.error("Category name is required");
      return;
    }

    try {
      setIsLoading(true);
      // Mock API call
      setTimeout(() => {
        setCategories((prev) =>
          prev.map((cat) =>
            cat._id === editingCategoryId
              ? {
                  ...cat,
                  name: categoryForm.name,
                  description: categoryForm.description,
                  isPublic: categoryForm.isPublic,
                  color: categoryForm.color,
                }
              : cat,
          ),
        );
        setIsLoading(false);

        toast.success(`Category "${categoryForm.name}" updated successfully`);

        // Reset form and close dialog
        setEditingCategoryId(null);
        setCategoryForm({
          name: "",
          description: "",
          isPublic: true,
          color: "#4287f5",
        });
        setEditDialogOpen(false);
      }, 500);
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
      setIsLoading(false);
    }
  };

  // Function to confirm delete of a category
  const handleConfirmDelete = (category: CalendarCategoryItem) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  // Function to handle deleting a category
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      setIsLoading(true);
      // Mock API call
      setTimeout(() => {
        setCategories((prev) =>
          prev.filter((cat) => cat._id !== selectedCategory._id),
        );
        setIsLoading(false);

        toast.success(
          `Category "${selectedCategory.name}" deleted successfully`,
        );
        setDeleteDialogOpen(false);
        setSelectedCategory(null);
      }, 500);
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
      setIsLoading(false);
    }
  };

  // Define entity actions
  const entityActions: EntityAction<CalendarCategoryItem>[] = [
    {
      id: "edit",
      label: "Edit",
      icon: <Pencil className="h-4 w-4" />,
      onClick: handleEditCategory,
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash className="h-4 w-4" />,
      onClick: handleConfirmDelete,
      variant: "destructive",
    },
  ];

  // Define filters
  const filters: FilterConfig<CalendarCategoryItem>[] = [
    {
      id: "visibility",
      label: "Visibility",
      type: "select",
      options: [
        { value: "all", label: "All" },
        { value: "public", label: "Public" },
        { value: "private", label: "Private" },
      ],
      field: "isPublic",
    },
  ];

  // Handle empty state
  const emptyState = (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="text-lg font-semibold">No Categories Found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Get started by creating your first calendar category.
      </p>
      <Button onClick={() => setAddDialogOpen(true)} className="mt-4">
        <FilePlus className="mr-2 h-4 w-4" />
        Create Category
      </Button>
    </div>
  );

  // Define columns with ids
  const columns: ColumnDefinition<CalendarCategoryItem>[] = [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      cell: (item) => <div className="font-medium">{item.name}</div>,
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      cell: (item) => (
        <div className="max-w-md truncate">
          {item.description ?? "No description"}
        </div>
      ),
    },
    {
      id: "color",
      header: "Color",
      accessorKey: "color",
      cell: (item) => (
        <div className="flex items-center">
          {item.color ? (
            <div
              className="mr-2 h-4 w-4 rounded-full"
              style={{ backgroundColor: item.color }}
            />
          ) : null}
          {item.color ?? "Default"}
        </div>
      ),
    },
    {
      id: "isPublic",
      header: "Public",
      accessorKey: "isPublic",
      cell: (item) => <div>{item.isPublic ? "Yes" : "No"}</div>,
    },
    {
      id: "createdAt",
      header: "Created",
      accessorKey: "_creationTime",
      cell: (item) => (
        <div>{new Date(item._creationTime).toLocaleDateString()}</div>
      ),
    },
  ];

  return (
    <div className="container p-8">
      <EntityList
        title="Calendar Categories"
        description="Manage categories for your calendar events."
        data={categories}
        columns={columns}
        isLoading={isLoading}
        entityActions={entityActions}
        filters={filters}
        emptyState={emptyState}
        actions={
          <Button onClick={() => setAddDialogOpen(true)}>
            <FilePlus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        }
      />

      {/* Add Category Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Calendar Category</DialogTitle>
            <DialogDescription>
              Create a new category for organizing your calendar events.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                placeholder="Enter category name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
                placeholder="Enter description (optional)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-full"
                  style={{ backgroundColor: categoryForm.color }}
                />
                <Input
                  id="color"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, color: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isPublic"
                checked={categoryForm.isPublic}
                onCheckedChange={(checked) =>
                  setCategoryForm({ ...categoryForm, isPublic: checked })
                }
              />
              <Label htmlFor="isPublic">Make this category public</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>Create Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Calendar Category</DialogTitle>
            <DialogDescription>
              Update this calendar category's information.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                placeholder="Enter category name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
                placeholder="Enter description (optional)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-full"
                  style={{ backgroundColor: categoryForm.color }}
                />
                <Input
                  id="edit-color"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, color: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-isPublic"
                checked={categoryForm.isPublic}
                onCheckedChange={(checked) =>
                  setCategoryForm({ ...categoryForm, isPublic: checked })
                }
              />
              <Label htmlFor="edit-isPublic">Make this category public</Label>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Calendar Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p>
              Category: <strong>{selectedCategory?.name}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              This will remove the category from all associated events.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
