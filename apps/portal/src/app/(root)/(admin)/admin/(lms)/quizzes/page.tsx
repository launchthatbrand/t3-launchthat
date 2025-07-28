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

type QuizData = Doc<"quizzes">;

interface DeleteQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  quizTitle: string;
}

function DeleteQuizDialog({
  open,
  onOpenChange,
  onConfirm,
  quizTitle,
}: DeleteQuizDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the quiz
            "<strong>{quizTitle}</strong>".
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

export default function AdminQuizzesPage() {
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

  const quizzes = useQuery(api.lms.quizzes.index.listQuizzes, queryParams);
  const deleteQuiz = useMutation(api.lms.quizzes.index.remove);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [quizToDelete, setQuizToDelete] = React.useState<QuizData | null>(null);

  const handleDeleteClick = (quiz: QuizData) => {
    setQuizToDelete(quiz);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (quizToDelete) {
      try {
        await deleteQuiz({ quizId: quizToDelete._id as any });
        setQuizToDelete(null);
      } catch (err) {
        console.error("Failed to delete quiz", err);
      }
    }
  };

  // Column definitions
  const columns: ColumnDef<QuizData>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
      cell: ({ row }) => {
        const quiz = row.original;
        return (
          <Link
            href={`/admin/quizzes/${quiz._id}`}
            className="font-medium hover:underline"
          >
            {quiz.title}
          </Link>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "isPublished",
      cell: ({ row }) => {
        const quiz = row.original;
        return (
          <Badge variant={quiz.isPublished ? "default" : "secondary"}>
            {quiz.isPublished ? "Published" : "Draft"}
          </Badge>
        );
      },
    },
  ];

  // Filters
  const filters: FilterConfig<QuizData>[] = [
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

  const entityActions: EntityAction<QuizData>[] = [
    {
      id: "view",
      label: "View",
      onClick: (quiz) => router.push(`/admin/quizzes/${quiz._id}`),
      variant: "outline",
      icon: <Plus className="mr-2 h-4 w-4" />,
    },
    {
      id: "edit",
      label: "Edit",
      onClick: (quiz) => router.push(`/admin/quizzes/${quiz._id}/edit`),
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
      <Link href="/admin/quizzes/new">
        <PlusCircle className="mr-2 h-4 w-4" /> Create Quiz
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

  if (quizzes === undefined) return <div>Loading quizzes...</div>;

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold">Quizzes</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* Filters sidebar */}
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

        {/* Entity list */}
        <div className="md:col-span-3">
          <EntityList<QuizData>
            data={quizzes ?? []}
            columns={columns}
            filters={filters}
            hideFilters={true}
            initialFilters={activeFilters}
            onFiltersChange={handleFilterChange}
            isLoading={quizzes === undefined}
            title="Quiz Management"
            description="Manage your quizzes here."
            defaultViewMode="list"
            viewModes={["list"]}
            entityActions={entityActions}
            actions={headerActions}
            emptyState={
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                <p className="text-muted-foreground">No quizzes found</p>
                <Button asChild variant="outline">
                  <Link href="/admin/quizzes/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create your first
                    quiz
                  </Link>
                </Button>
              </div>
            }
          />
        </div>
      </div>

      {/* Delete dialog */}
      {quizToDelete && (
        <DeleteQuizDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          quizTitle={quizToDelete.title}
        />
      )}
    </div>
  );
}
