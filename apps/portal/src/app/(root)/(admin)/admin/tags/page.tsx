"use client";

import { Card, CardContent } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import TagForm, { TagFormValues } from "./_components/TagForm";
import { useMemo, useState } from "react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import { Plus } from "lucide-react";
import { toast } from "@acme/ui/toast";
import { useMarketingTags } from "~/hooks/useMarketingTags";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function TagsAdminPage() {
  const { marketingTags, createTag } = useMarketingTags();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  type MarketingTag = NonNullable<typeof marketingTags>[number];

  const sortedTags = useMemo(() => {
    if (!marketingTags) {
      return [];
    }
    return [...marketingTags].sort((a, b) => a.name.localeCompare(b.name));
  }, [marketingTags]);
  const columns = useMemo<ColumnDef<MarketingTag>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: row.original.color ?? "#6366f1" }}
            />
            {row.original.name}
            {row.original.category && (
              <Badge variant="outline" className="text-xs">
                {row.original.category}
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="max-w-md truncate text-sm text-muted-foreground">
            {row.original.description ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "slug",
        header: "Slug",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.slug ?? slugify(row.original.name)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive === false ? "secondary" : "default"}
          >
            {row.original.isActive === false ? "Inactive" : "Active"}
          </Badge>
        ),
      },
      {
        id: "created",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt ?? row.original._creationTime)}
          </span>
        ),
      },
    ],
    [],
  );

  const handleCreateTag = async (values: TagFormValues) => {
    setIsSubmitting(true);
    try {
      await createTag({
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        slug: slugify(values.name),
        color: "#6366f1",
        isActive: true,
      });
      toast.success("Tag created successfully");
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "—";
    try {
      return new Date(timestamp).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  return (
    <div className="container mx-auto space-y-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Tags</h1>
          <p className="text-muted-foreground">
            Manage the tags used for access control and segmentation.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Tag</DialogTitle>
            </DialogHeader>
            <TagForm onSave={handleCreateTag} isSubmitting={isSubmitting} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <EntityList
            data={sortedTags}
            columns={columns}
            isLoading={marketingTags === undefined}
            enableFooter={false}
            enableSearch
            viewModes={["list"]}
            defaultViewMode="list"
            emptyState={
              <div className="py-10 text-center text-muted-foreground">
                No tags yet. Create your first tag to get started.
              </div>
            }
            className="p-4"
          />
        </CardContent>
      </Card>
    </div>
  );
}
