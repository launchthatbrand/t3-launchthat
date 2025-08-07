"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Edit, Plus, PlusCircle, Trash } from "lucide-react";
import { useDebounce } from "use-debounce";

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
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import type { Doc } from "../../../../../../../convex/_generated/dataModel";
import type {
  EntityAction,
  FilterConfig,
  FilterValue,
} from "~/components/shared/EntityList/types";
import {
  AdminLayoutContent,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import { DetachableFilters } from "~/components/shared/EntityList/DetachableFilters";
import { EntityList } from "~/components/shared/EntityList/EntityList";

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
    <AdminLayoutContent withSidebar>
      <AdminLayoutMain>
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
          viewModes={[""]}
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

        {topicToDelete && (
          <DeleteTopicDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={handleConfirmDelete}
            topicTitle={topicToDelete.title}
          />
        )}
      </AdminLayoutMain>
      <AdminLayoutSidebar>
        {/* Sidebar content goes here */}
        <Card>
          <CardHeader>
            <CardTitle>Sidebar</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Topic Sidebar content</p>
          </CardContent>
        </Card>
      </AdminLayoutSidebar>
    </AdminLayoutContent>
  );
}
