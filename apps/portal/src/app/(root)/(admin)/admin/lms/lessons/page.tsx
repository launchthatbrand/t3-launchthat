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

type LessonData = Doc<"lessons">;

interface DeleteLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  lessonTitle: string;
}

function DeleteLessonDialog({
  open,
  onOpenChange,
  onConfirm,
  lessonTitle,
}: DeleteLessonDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            lesson "<strong>{lessonTitle}</strong>".
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

export default function AdminLessonsPage() {
  const router = useRouter();
  const [searchTitle, setSearchTitle] = React.useState("");
  const [debouncedSearchTitle] = useDebounce(searchTitle, 300);
  const [activeFilters, setActiveFilters] = React.useState<
    Record<string, FilterValue>
  >({});

  const queryParams = React.useMemo(() => {
    const params: { searchTitle?: string; isPublished?: boolean } = {};

    if (debouncedSearchTitle) params.searchTitle = debouncedSearchTitle;

    if (activeFilters.isPublished !== undefined) {
      params.isPublished = activeFilters.isPublished as boolean;
    }

    return params;
  }, [debouncedSearchTitle, activeFilters]);

  const lessons = useQuery(api.lms.lessons.queries.listLessons, queryParams);
  const deleteLesson = useMutation(api.lms.lessons.mutations.remove);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [lessonToDelete, setLessonToDelete] = React.useState<LessonData | null>(
    null,
  );

  const handleDeleteClick = (lesson: LessonData) => {
    setLessonToDelete(lesson);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (lessonToDelete) {
      try {
        await deleteLesson({ lessonId: lessonToDelete._id });
        setLessonToDelete(null);
      } catch (err) {
        console.error("Failed to delete lesson", err);
      }
    }
  };

  // Columns for lessons
  const columns: ColumnDef<LessonData>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
      cell: ({ row }) => {
        const lesson = row.original;
        return (
          <Link
            href={`/admin/lessons/${lesson._id}`}
            className="font-medium hover:underline"
          >
            {lesson.title}
          </Link>
        );
      },
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      cell: ({ row }) => {
        const lesson = row.original;
        return (
          <div className="max-w-xs truncate">{lesson.description ?? "N/A"}</div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "isPublished",
      cell: ({ row }) => {
        const lesson = row.original;
        return (
          <Badge variant={lesson.isPublished ? "default" : "secondary"}>
            {lesson.isPublished ? "Published" : "Draft"}
          </Badge>
        );
      },
    },
  ];

  // Filters
  const filters: FilterConfig<LessonData>[] = [
    {
      id: "title",
      label: "Title",
      type: "text",
      field: "title",
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

  // Entity actions
  const entityActions: EntityAction<LessonData>[] = [
    {
      id: "view",
      label: "View",
      onClick: (lesson) => router.push(`/admin/lessons/${lesson._id}`),
      variant: "outline",
      icon: <Plus className="mr-2 h-4 w-4" />,
    },
    {
      id: "edit",
      label: "Edit",
      onClick: (lesson) => router.push(`/admin/lessons/${lesson._id}/edit`),
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
      <Link href="/admin/lessons/new">
        <PlusCircle className="mr-2 h-4 w-4" /> Create Lesson
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

  return (
    <AdminLayoutContent withSidebar>
      <AdminLayoutMain>
        <EntityList<LessonData>
          data={lessons ?? []}
          columns={columns}
          filters={filters}
          hideFilters={true}
          initialFilters={activeFilters}
          onFiltersChange={handleFilterChange}
          isLoading={lessons === undefined}
          title="Lesson Management"
          description="Manage your lessons here."
          defaultViewMode="list"
          viewModes={[]}
          entityActions={entityActions}
          actions={headerActions}
          emptyState={
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
              <p className="text-muted-foreground">No lessons found</p>
              <Button asChild variant="outline">
                <Link href="/admin/lessons/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create your first
                  lesson
                </Link>
              </Button>
            </div>
          }
        />

        <DeleteLessonDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          lessonTitle={lessonToDelete?.title ?? ""}
        />
      </AdminLayoutMain>
      <AdminLayoutSidebar>
        {/* Sidebar content goes here */}
        <Card>
          <CardHeader>
            <CardTitle>Sidebar</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Lesson Sidebar content</p>
          </CardContent>
        </Card>
      </AdminLayoutSidebar>
    </AdminLayoutContent>
  );
}
