"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

import type { Doc } from "../../../../../convex/_generated/dataModel";
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
  FilterValue,
} from "~/components/shared/EntityList/types";
import { DetachableFilters } from "~/components/shared/EntityList/DetachableFilters";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import { api } from "../../../../../convex/_generated/api";

type CourseData = Doc<"courses">;

interface DeleteCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  courseTitle: string;
}

function DeleteCourseDialog({
  open,
  onOpenChange,
  onConfirm,
  courseTitle,
}: DeleteCourseDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            course "<strong>{courseTitle}</strong>".
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

export default function AdminCoursesPage() {
  const router = useRouter();
  const [searchTitle, setSearchTitle] = React.useState("");
  const [debouncedSearchTitle] = useDebounce(searchTitle, 300);
  const [activeFilters, setActiveFilters] = React.useState<
    Record<string, FilterValue>
  >({});

  // Apply filters to the query parameters
  const queryParams = React.useMemo(() => {
    const params: { searchTitle: string; isPublished?: boolean } = {
      searchTitle: debouncedSearchTitle,
    };

    // Map active filters to query parameters
    if (activeFilters.title && typeof activeFilters.title === "string") {
      params.searchTitle = activeFilters.title;
    }

    if (activeFilters.isPublished !== undefined) {
      params.isPublished = activeFilters.isPublished as boolean;
    }

    return params;
  }, [debouncedSearchTitle, activeFilters]);

  const courses = useQuery(api.courses.listCourses, queryParams);
  const deleteCourse = useMutation(api.courses.deleteCourse);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [courseToDelete, setCourseToDelete] = React.useState<CourseData | null>(
    null,
  );

  const handleDeleteClick = (course: CourseData) => {
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (courseToDelete) {
      try {
        await deleteCourse({ courseId: courseToDelete._id });
        console.log("Course deleted:", courseToDelete._id);
        setCourseToDelete(null);
      } catch (error) {
        console.error("Failed to delete course:", error);
      }
    }
  };

  // Define columns for EntityList
  const columns: ColumnDefinition<CourseData>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      sortable: true,
      cell: (course) => (
        <Link
          href={`/admin/courses/${course._id}`}
          className="font-medium hover:underline"
        >
          {course.title}
        </Link>
      ),
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      cell: (course) => (
        <div className="max-w-xs truncate">{course.description ?? "N/A"}</div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "isPublished",
      cell: (course) => (
        <Badge variant={course.isPublished ? "default" : "secondary"}>
          {course.isPublished ? "Published" : "Draft"}
        </Badge>
      ),
    },
  ];

  // Define filter configurations
  const filters: FilterConfig<CourseData>[] = [
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

  // Define entity actions
  const entityActions: EntityAction<CourseData>[] = [
    {
      id: "view",
      label: "View",
      onClick: (course) => {
        router.push(`/admin/courses/${course._id}`);
      },
      variant: "outline",
      icon: <Plus className="mr-2 h-4 w-4" />,
    },
    {
      id: "edit",
      label: "Edit",
      onClick: (course) => {
        router.push(`/admin/courses/${course._id}/edit`);
      },
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

  // Custom actions for the EntityList header
  const headerActions = (
    <Button asChild>
      <Link href="/admin/courses/new">
        <PlusCircle className="mr-2 h-4 w-4" /> Create Course
      </Link>
    </Button>
  );

  // Handle filter changes
  const handleFilterChange = (newFilters: Record<string, FilterValue>) => {
    setActiveFilters(newFilters);

    // Update search title if title filter is present
    if (newFilters.title && typeof newFilters.title === "string") {
      setSearchTitle(newFilters.title);
    } else {
      setSearchTitle("");
    }
  };

  return (
    <div className="container py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Button asChild>
          <Link href="/admin/courses/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Create Course
          </Link>
        </Button>
      </div>

      {/* Sidebar layout with filters on the left and content on the right */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* Left sidebar with filters */}
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

        {/* Main content area */}
        <div className="md:col-span-3">
          <EntityList<CourseData>
            data={courses ?? []}
            columns={columns}
            filters={filters}
            hideFilters={true}
            initialFilters={activeFilters}
            onFiltersChange={handleFilterChange}
            isLoading={courses === undefined}
            title="Course Management"
            description="Manage your courses here."
            defaultViewMode="list"
            viewModes={["list"]}
            entityActions={entityActions}
            actions={headerActions}
            emptyState={
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                <p className="text-muted-foreground">No courses found</p>
                <Button asChild variant="outline">
                  <Link href="/admin/courses/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create your first
                    course
                  </Link>
                </Button>
              </div>
            }
          />
        </div>
      </div>

      <DeleteCourseDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        courseTitle={courseToDelete?.title ?? ""}
      />
    </div>
  );
}
