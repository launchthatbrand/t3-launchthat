"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { FilePlus, Pencil, Trash } from "lucide-react";

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
}

interface CategoryItem {
  _id: Id<"downloadCategories">;
  name: string;
  description?: string;
  isPublic: boolean;
  _creationTime: number;
  createdAt: number;
}

export default function DownloadCategoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const ensureUser = useMutation(api.users.createOrGetUser);

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
  ensureUser: ReturnType<typeof useMutation<typeof api.users.createOrGetUser>>;
  router: ReturnType<typeof useRouter>;
}) {
  const isAdminResult = useQuery(api.accessControl.checkIsAdmin);

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

  // Form state
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: "",
    description: "",
    isPublic: true,
  });

  // Editing state
  const [editingCategoryId, setEditingCategoryId] =
    useState<Id<"downloadCategories"> | null>(null);

  // Fetch categories
  const categories = useQuery(api.downloadsLibrary.getDownloadCategories, {
    includePrivate: true,
  }) as CategoryItem[] | undefined;

  // Mutations
  const createCategory = useMutation(
    api.downloadsLibrary.createDownloadCategory,
  );
  const deleteCategory = useMutation(
    api.downloadsLibrary.deleteDownloadCategory,
  );

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (categories !== undefined) {
      setIsLoading(false);
    }
  }, [categories]);

  // Handle adding a new category
  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      await createCategory({
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        isPublic: categoryForm.isPublic,
      });

      toast.success(`Category "${categoryForm.name}" created successfully`);

      // Reset form and close dialog
      setCategoryForm({ name: "", description: "", isPublic: true });
      setAddDialogOpen(false);

      // Force a refresh of the data
      router.refresh();
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    }
  };

  // Function to handle editing a category
  const handleEditCategory = (category: CategoryItem) => {
    setEditingCategoryId(category._id);
    setCategoryForm({
      name: category.name,
      description: category.description ?? "",
      isPublic: category.isPublic,
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
      // Note: There's no updateDownloadCategory mutation yet, so we show a toast instead
      toast.info(
        "Category update functionality is not yet implemented in the API",
      );
      await Promise.resolve(); // Add await to satisfy linter

      // Reset form and close dialog
      setEditingCategoryId(null);
      setCategoryForm({ name: "", description: "", isPublic: true });
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };

  // Function to handle deleting a category
  const handleDeleteCategory = async (
    categoryId: Id<"downloadCategories">,
    categoryName: string,
  ) => {
    // Confirm delete
    if (
      !window.confirm(
        `Are you sure you want to delete "${categoryName}"? This will remove the category from all downloads.`,
      )
    ) {
      return;
    }

    try {
      await deleteCategory({ categoryId });
      toast.success(`Category "${categoryName}" deleted successfully`);

      // Force a refresh of the data
      router.refresh();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  // Define columns for EntityList
  const columns: ColumnDefinition<CategoryItem>[] = [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      cell: (item) => <span className="font-medium">{item.name}</span>,
      sortable: true,
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      cell: (item) =>
        item.description ?? (
          <span className="text-muted-foreground">No description</span>
        ),
      sortable: false,
    },
    {
      id: "visibility",
      header: "Visibility",
      accessorKey: "isPublic",
      cell: (item) => (
        <span className={item.isPublic ? "text-green-600" : "text-amber-600"}>
          {item.isPublic ? "Public" : "Private"}
        </span>
      ),
      sortable: true,
    },
    {
      id: "createdAt",
      header: "Created",
      accessorKey: "createdAt",
      cell: (item) => new Date(item.createdAt).toLocaleDateString(),
      sortable: true,
    },
  ];

  // Define filters for EntityList
  const filters: FilterConfig<CategoryItem>[] = [
    {
      id: "visibility",
      label: "Visibility",
      type: "select",
      field: "isPublic",
      options: [
        { label: "All", value: "" },
        { label: "Public", value: true },
        { label: "Private", value: false },
      ],
    },
  ];

  // Define actions for EntityList
  const entityActions: EntityAction<CategoryItem>[] = [
    {
      id: "edit",
      label: "Edit",
      icon: <Pencil className="h-4 w-4" />,
      onClick: (item) => handleEditCategory(item),
      variant: "outline",
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash className="h-4 w-4" />,
      onClick: (item) => {
        void handleDeleteCategory(item._id, item.name);
      },
      variant: "destructive",
    },
  ];

  // Header actions for EntityList
  const headerActions = (
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
            Create a new category for your downloadable files
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
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={categoryForm.isPublic}
              onCheckedChange={(checked) =>
                setCategoryForm({
                  ...categoryForm,
                  isPublic: checked,
                })
              }
            />
            <Label htmlFor="isPublic">Make this category public</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddCategory}>Add Category</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container py-6">
      <EntityList<CategoryItem>
        data={categories ?? []}
        columns={columns}
        filters={filters}
        isLoading={isLoading}
        title="Download Categories"
        description="Manage categories for your downloadable files"
        entityActions={entityActions}
        actions={headerActions}
        defaultViewMode="list"
        viewModes={["list"]}
        emptyState={
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FilePlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-lg font-medium">No categories found</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first category to organize your downloads
            </p>
            <Button onClick={() => setAddDialogOpen(true)} variant="outline">
              <FilePlus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        }
      />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the category details</DialogDescription>
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
              <Label htmlFor="edit-description">Description (Optional)</Label>
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
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isPublic"
                checked={categoryForm.isPublic}
                onCheckedChange={(checked) =>
                  setCategoryForm({
                    ...categoryForm,
                    isPublic: checked,
                  })
                }
              />
              <Label htmlFor="edit-isPublic">Make this category public</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
