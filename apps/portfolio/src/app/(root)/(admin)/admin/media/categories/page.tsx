"use client";

import React, { useState } from "react";
import { EntityList } from "@/components/shared/EntityList/EntityList";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Textarea } from "@acme/ui/textarea";

const POST_TYPE = "media";

type Category = Doc<"categories">;

const CategoriesPage = () => {
  const categories = useQuery(
    api.core.categories.queries.listCategoriesByPostType,
    {
      postType: POST_TYPE,
    },
  );
  const createCategory = useMutation(api.categories.mutations.createCategory);
  const updateCategory = useMutation(api.categories.mutations.updateCategory);
  const deleteCategory = useMutation(api.categories.mutations.deleteCategory);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [editId, setEditId] = useState<Id<"categories"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] =
    useState<Id<"categories"> | null>(null);

  const handleOpen = () => {
    setForm({ name: "", description: "" });
    setEditId(null);
    setError(null);
    setOpen(true);
  };

  const handleEdit = (item: Category) => {
    setForm({
      name: item.name,
      description: item.description ?? "",
    });
    setEditId(item._id);
    setError(null);
    setOpen(true);
  };

  const handleDelete = async (item: Category) => {
    if (
      !window.confirm(`Delete category '${item.name}'? This cannot be undone.`)
    )
      return;
    setDeleteLoadingId(item._id);
    try {
      await deleteCategory({ categoryId: item._id });
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to delete category");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editId) {
        await updateCategory({
          categoryId: editId,
          name: form.name,
          description: form.description || undefined,
          postTypes: [POST_TYPE],
        });
      } else {
        await createCategory({
          name: form.name,
          description: form.description || undefined,
          postTypes: [POST_TYPE],
        });
      }
      setOpen(false);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      cell: (item: Category) => (
        <span className="max-w-xs truncate">
          {item.description ?? (
            <span className="text-muted-foreground">N/A</span>
          )}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (item: Category) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleEdit(item)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(item)}
            disabled={deleteLoadingId === item._id}
          >
            {deleteLoadingId === item._id ? "Deleting..." : "Delete"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container py-8">
      <EntityList
        data={categories ?? []}
        columns={columns}
        title="Media Categories"
        description="Manage categories assigned to the media post type."
        isLoading={!categories}
        emptyState={<div>No media categories found.</div>}
        actions={<Button onClick={handleOpen}>New Category</Button>}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>
            {editId ? "Edit Category" : "Create Category"}
          </DialogTitle>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="name"
              placeholder="Category name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <Textarea
              name="description"
              placeholder="Description (optional)"
              value={form.description}
              onChange={handleChange}
            />
            {error && <div className="text-sm text-destructive">{error}</div>}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? editId
                    ? "Saving..."
                    : "Creating..."
                  : editId
                    ? "Save"
                    : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesPage;
