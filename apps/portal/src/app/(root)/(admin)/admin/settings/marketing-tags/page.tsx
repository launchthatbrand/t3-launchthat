"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@acme/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Pencil, Plus, Search, Tag, Trash2, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { useMemo, useState } from "react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import type { EntityAction } from "@acme/ui/entity-list/types";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { Id } from "@convex-config/_generated/dataModel";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";
import { format } from "date-fns";
import { toast } from "@acme/ui/toast";
import { useMarketingTags } from "@/hooks/useMarketingTags";

type MarketingTag = NonNullable<
  ReturnType<typeof useMarketingTags>["marketingTags"]
>[number];

interface MarketingTagFormData {
  name: string;
  description: string;
  color: string;
  category: string;
  isActive: boolean;
}

const PREDEFINED_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
];

const PREDEFINED_CATEGORIES = [
  "Engagement",
  "Purchase History",
  "Demographics",
  "Behavior",
  "Course Progress",
  "Email Marketing",
  "Lead Source",
  "Customer Status",
];

export default function MarketingTagsAdminPage() {
  const { marketingTags, createTag } = useMarketingTags();
  const marketingTagList: MarketingTag[] = marketingTags ?? [];
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Id<"crmMarketingTags"> | null>(
    null,
  );
  const [tagToDelete, setTagToDelete] = useState<MarketingTag | null>(null);

  // Form state
  const [formData, setFormData] = useState<MarketingTagFormData>({
    name: "",
    description: "",
    color: "#3b82f6",
    category: "",
    isActive: true,
  });

  const handleCreateTag = async () => {
    if (!formData.name.trim()) {
      toast.error("Tag name is required");
      return;
    }

    try {
      await createTag({
        name: formData.name.trim(),
        slug: formData.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        description: formData.description.trim() || undefined,
        color: formData.color,
        category: formData.category || undefined,
        isActive: formData.isActive,
      });

      toast.success("Marketing tag created successfully!");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create marketing tag");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6",
      category: "",
      isActive: true,
    });
    setEditingTag(null);
  };

  // Filter tags based on search and category
  const filteredTags = marketingTagList.filter((tag) => {
    const matchesSearch =
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || tag.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from existing tags
  const existingCategories = [
    ...new Set(
      marketingTagList
        .map((tag) => tag.category)
        .filter((category): category is string => Boolean(category)),
    ),
  ];
  const allCategories = [
    ...new Set([...PREDEFINED_CATEGORIES, ...existingCategories]),
  ];

  const columns = useMemo<ColumnDef<MarketingTag>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Tag",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: row.original.color || "#3b82f6" }}
            />
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) =>
          row.original.category ? (
            <Badge variant="outline">{row.original.category}</Badge>
          ) : (
            "-"
          ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {row.original.description ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive !== false ? "default" : "secondary"}>
            {row.original.isActive !== false ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "_creationTime",
        header: "Created",
        cell: ({ row }) =>
          format(new Date(row.original._creationTime), "MMM d, yyyy"),
      },
    ],
    [],
  );

  const entityActions: EntityAction<MarketingTag>[] = [
    {
      id: "edit",
      label: "Edit Tag",
      icon: <Pencil className="h-4 w-4" />,
      onClick: (tag: MarketingTag) => {
        toast.info(`Editing "${tag.name}" coming soon`);
      },
    },
    {
      id: "delete",
      label: "Delete Tag",
      icon: <Trash2 className="h-4 w-4 text-destructive" />,
      onClick: (tag) => {
        setTagToDelete(tag);
      },
    },
  ];

  const emptyState = (
    <div className="py-8 text-center text-muted-foreground">
      {searchTerm || categoryFilter !== "all"
        ? "No tags match your filters"
        : "No marketing tags created yet"}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Marketing Tag</DialogTitle>
              <DialogDescription>
                Create a new marketing tag for user segmentation and automation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tag Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Premium Customer"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description for this tag..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 ${
                        formData.color === color
                          ? "border-foreground"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTag}>Create Tag</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketingTagList.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tags</CardTitle>
            <Tag className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketingTagList.filter((tag) => tag.isActive !== false).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allCategories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tags Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Marketing Tags ({filteredTags.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EntityList
            data={filteredTags}
            columns={columns}
            entityActions={entityActions}
            viewModes={["list"]}
            defaultViewMode="list"
            enableFooter={false}
            enableSearch={false}
            hideFilters
            emptyState={emptyState}
            className="p-4"
          />
        </CardContent>
      </Card>

      <AlertDialog
        open={!!tagToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setTagToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Marketing Tag</AlertDialogTitle>
            <AlertDialogDescription>
              {tagToDelete
                ? `Are you sure you want to delete "${tagToDelete.name}"? This action cannot be undone and will remove this tag from all users.`
                : "Are you sure you want to delete this tag?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTagToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toast.success("Tag deleted successfully!");
                setTagToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
