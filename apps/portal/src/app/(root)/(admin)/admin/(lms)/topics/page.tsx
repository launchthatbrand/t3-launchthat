"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@acme/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Edit, Plus, PlusCircle, Trash } from "lucide-react";
import type {
  EntityAction,
  FilterConfig,
  FilterValue,
} from "~/components/shared/EntityList/types";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { DetachableFilters } from "~/components/shared/EntityList/DetachableFilters";
import type { Doc } from "../../../../../../../convex/_generated/dataModel";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import Link from "next/link";
import { api } from "@convex-config/_generated/api";
import { useDebounce } from "use-debounce";
import { useRouter } from "next/navigation";

type TopicData = Doc<"topics">;

interface DeleteTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  topicTitle: string;
}

function DeleteTopicDialog({
  open,
  onOpenChange,
  onConfirm,
  topicTitle,
}: DeleteTopicDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the topic
            "<strong>{topicTitle}</strong>".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AdminTopicsPage() {
  const router = useRouter();
  const [searchTitle, setSearchTitle] = React.useState("");
  const [debouncedSearchTitle] = useDebounce(searchTitle, 300);
  const [activeFilters, setActiveFilters] = React.useState<
    Record<string, FilterValue>
  >({});

  const queryParams = React.useMemo(() => {
    const params: { searchTitle?: string } = {};

    if (debouncedSearchTitle) params.searchTitle = debouncedSearchTitle;

    return params;
  }, [debouncedSearchTitle]);

  const topics = useQuery(api.lms.topics.index.listTopics, queryParams);
  console.log("topics", topics);
  const deleteTopic = useMutation(api.lms.topics.index.remove);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [topicToDelete, setTopicToDelete] = React.useState<TopicData | null>(
    null,
  );

  const handleDeleteClick = (topic: TopicData) => {
    setTopicToDelete(topic);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (topicToDelete) {
      try {
        await deleteTopic({ topicId: topicToDelete._id });
        setTopicToDelete(null);
      } catch (err) {
        console.error("Failed to delete topic", err);
      }
    }
  };

  const columns: ColumnDef<TopicData>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
      cell: ({ row }) => {
        const topic = row.original;
        return (
          <Link
            href={`/admin/topics/${topic._id}`}
            className="font-medium hover:underline"
          >
            {topic.title}
          </Link>
        );
      },
    },
    {
      id: "contentType",
      header: "Type",
      accessorKey: "contentType",
      cell: ({ row }) => {
        const topic = row.original;
        return <span>{topic.contentType}</span>;
      },
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "isPublished",
      cell: ({ row }) => {
        const topic = row.original;
        return (
          <Badge variant={topic.isPublished ? "default" : "secondary"}>
            {topic.isPublished ? "Published" : "Draft"}
          </Badge>
        );
      },
    },
  ];

  const filters: FilterConfig<TopicData>[] = [
    {
      id: "title",
      label: "Title",
      type: "text",
      field: "title",
    },
    {
      id: "contentType",
      label: "Type",
      type: "select",
      field: "contentType",
      options: [
        { label: "Text", value: "text" },
        { label: "Video", value: "video" },
        { label: "Quiz", value: "quiz" },
      ],
    },
    {
      id: "isPublished",
      label: "Status",
      type: "select",
      field: "isPublished",
      options: [
        { label: "Published", value: true },
        { label: "Draft", value: false },
      ],
    },
  ];

  const entityActions: EntityAction<TopicData>[] = [
    {
      id: "view",
      label: "View",
      onClick: (topic) => router.push(`/admin/topics/${topic._id}`),
      variant: "outline",
      icon: <Plus className="mr-2 h-4 w-4" />,
    },
    {
      id: "edit",
      label: "Edit",
      onClick: (topic) => router.push(`/admin/topics/${topic._id}/edit`),
      variant: "secondary",
      icon: <Edit className="mr-2 h-4 w-4" />,
    },
    {
      id: "delete",
      label: "Delete",
      onClick: handleDeleteClick,
      variant: "destructive",
      icon: <Trash className="mr-2 h-4 w-4" />,
    },
  ];

  const headerActions = (
    <Button asChild>
      <Link href="/admin/topics/new">
        <PlusCircle className="mr-2 h-4 w-4" /> Create Topic
      </Link>
    </Button>
  );

  const handleFilterChange = (newFilters: Record<string, FilterValue>) => {
    setActiveFilters(newFilters);

    if (newFilters.title && typeof newFilters.title === "string") {
      setSearchTitle(newFilters.title);
    } else {
      setSearchTitle("");
    }
  };

  if (topics === undefined) return <div>Loading topics...</div>;

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold">Topics</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <DetachableFilters
                filters={filters}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
              />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <EntityList<TopicData>
            data={topics ?? []}
            columns={columns}
            filters={filters}
            hideFilters={true}
            initialFilters={activeFilters}
            onFiltersChange={handleFilterChange}
            isLoading={topics === undefined}
            title="Topic Management"
            description="Manage your topics here."
            defaultViewMode="list"
            entityActions={entityActions}
            actions={headerActions}
            emptyState={
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                <p className="text-muted-foreground">No topics found</p>
                <Button asChild variant="outline">
                  <Link href="/admin/topics/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create your first
                    topic
                  </Link>
                </Button>
              </div>
            }
          />
        </div>
      </div>

      {topicToDelete && (
        <DeleteTopicDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          topicTitle={topicToDelete.title}
        />
      )}
    </div>
  );
}
