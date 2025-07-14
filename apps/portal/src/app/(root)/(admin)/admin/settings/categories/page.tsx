"use client";

import React, { useState } from "react";
import { EntityList } from "@/components/shared/EntityList/EntityList";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Textarea } from "@acme/ui/textarea";

const POST_TYPE_OPTIONS = [
  "downloads",
  "posts",
  "products",
  "media",
  // Add more post types as needed
];

const CategoriesPage = () => {
  const categories = useQuery(api.categories.queries.listCategories, {});
  const createCategory = useMutation(api.categories.mutations.createCategory);
  const deleteCategory = useMutation(api.categories.mutations.deleteCategory); // You need to implement this mutation in Convex
  const updateCategory = useMutation(api.categories.mutations.updateCategory); // You need to implement this mutation in Convex

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    postTypes: [] as string[],
  });
  const [editId, setEditId] = useState<Id<"categories"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] =
    useState<Id<"categories"> | null>(null);

  const handleOpen = () => {
    setForm({ name: "", description: "", postTypes: [] });
    setEditId(null);
    setError(null);
    setOpen(true);
  };

  const handleEdit = (item: Doc<"categories">) => {
    setForm({
      name: item.name,
      description: item.description || "",
      postTypes: item.postTypes || [],
    });
    setEditId(item._id);
    setError(null);
    setOpen(true);
  };

  const handleDelete = async (item: Doc<"categories">) => {
    if (
      !window.confirm(`Delete category '${item.name}'? This cannot be undone.`)
    )
      return;
    setDeleteLoadingId(item._id);
    try {
      await deleteCategory({ categoryId: item._id });
    } catch (err: any) {
      alert(err.message || "Failed to delete category");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePostTypeToggle = (type: string) => {
    setForm((prev) => ({
      ...prev,
      postTypes: prev.postTypes.includes(type)
        ? prev.postTypes.filter((t) => t !== type)
        : [...prev.postTypes, type],
    }));
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
          postTypes: form.postTypes,
        });
      } else {
        await createCategory({
          name: form.name,
          description: form.description || undefined,
          postTypes: form.postTypes,
        });
      }
      setOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to save category");
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
      cell: (item: Doc<"categories">) => (
        <span className="max-w-xs truncate">
          {item.description || (
            <span className="text-muted-foreground">N/A</span>
          )}
        </span>
      ),
    },
    {
      id: "postTypes",
      header: "Post Types",
      accessorKey: "postTypes",
      cell: (item: Doc<"categories">) => (
        <div className="flex flex-wrap gap-1">
          {item.postTypes.map((type) => (
            <Badge key={type}>{type}</Badge>
          ))}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (item: Doc<"categories">) => (
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
        title="Categories"
        description="Manage categories and their associated post types."
        isLoading={!categories}
        emptyState={<div>No categories found.</div>}
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
              label="Name"
              placeholder="Category name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <Textarea
              name="description"
              label="Description"
              placeholder="Description (optional)"
              value={form.description}
              onChange={handleChange}
            />
            <div>
              <div className="mb-2 font-medium">Post Types</div>
              <div className="flex flex-wrap gap-2">
                {POST_TYPE_OPTIONS.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={
                      form.postTypes.includes(type) ? "default" : "outline"
                    }
                    className="px-3 py-1"
                    onClick={() => handlePostTypeToggle(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
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
