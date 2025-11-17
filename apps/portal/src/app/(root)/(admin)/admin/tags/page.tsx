"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Skeleton } from "@acme/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { toast } from "@acme/ui/toast";

import { useMarketingTags } from "~/hooks/useMarketingTags";
import TagForm, { TagFormValues } from "./_components/TagForm";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function TagsAdminPage() {
  const { marketingTags, createTag } = useMarketingTags();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedTags = useMemo(() => {
    if (!marketingTags) {
      return [];
    }
    return [...marketingTags].sort((a, b) => a.name.localeCompare(b.name));
  }, [marketingTags]);

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketingTags === undefined && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex items-center gap-4 p-4">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {marketingTags !== undefined && sortedTags.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    <p className="text-sm text-muted-foreground">
                      No tags yet. Create your first tag to get started.
                    </p>
                  </TableCell>
                </TableRow>
              )}

              {sortedTags.map((tag) => (
                <TableRow key={tag._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: tag.color ?? "#6366f1" }}
                      />
                      {tag.name}
                      {tag.category && (
                        <Badge variant="outline" className="text-xs">
                          {tag.category}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                    {tag.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tag.slug ?? slugify(tag.name)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={tag.isActive === false ? "secondary" : "default"}
                    >
                      {tag.isActive === false ? "Inactive" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(tag.createdAt ?? tag._creationTime)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
