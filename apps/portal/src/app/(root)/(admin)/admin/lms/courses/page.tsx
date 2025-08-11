/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
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
import { EntityList } from "~/components/shared/EntityList/EntityList";

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
    const params: {
      searchTerm?: string;
      isPublished?: boolean;
    } = {};

    // Map active filters to query parameters
    if (activeFilters.title && typeof activeFilters.title === "string") {
      params.searchTerm = activeFilters.title;
    } else if (debouncedSearchTitle) {
      params.searchTerm = debouncedSearchTitle;
    }

    if (activeFilters.isPublished !== undefined) {
      params.isPublished = activeFilters.isPublished as boolean;
    }

    return params;
  }, [debouncedSearchTitle, activeFilters]);

  // Use searchCourses when there's a search term, otherwise use listCourses with pagination
  const normalizedSearchTerm =
    typeof queryParams.searchTerm === "string"
      ? queryParams.searchTerm.trim()
      : "";
  const hasSearch = normalizedSearchTerm.length > 0;

  const test = useQuery(api.ecommerce.orders.queries.getOrderById, {
    id: "123",
  });

  console.log(test);

  const test2 = useQuery(api.ecommerce.orders.queries.getOrders, {
    limit: 10,
  });

  const searchResults: Doc<"courses">[] | undefined = useQuery(
    api.lms.courses.queries.searchCourses,
    hasSearch
      ? {
          searchTerm: normalizedSearchTerm,
          isPublished: queryParams.isPublished,
          limit: 50,
        }
      : "skip",
  );

  const listResults = useQuery(
    api.lms.courses.queries.listCourses,
    !hasSearch
      ? {
          paginationOpts: { numItems: 50, cursor: null },
          isPublished: queryParams.isPublished,
        }
      : "skip",
  );

  // Use whichever query is active and normalize the data format
  const coursesData = hasSearch ? searchResults : listResults?.page;
  const courses: CourseData[] = coursesData ?? [];

  const deleteCourse = useMutation(api.lms.courses.mutations.deleteCourse);

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
        await deleteCourse({ id: courseToDelete._id });
        console.log("Course deleted:", courseToDelete._id);
        setCourseToDelete(null);
      } catch (error) {
        console.error("Failed to delete course:", error);
      }
    }
  };

  // Define columns for EntityList
  const columns: ColumnDef<CourseData>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
      cell: ({ row }) => {
        const course = row.original;
        return (
          <Link
            href={`/admin/courses/${course._id}`}
            className="font-medium hover:underline"
          >
            {course.title}
          </Link>
        );
      },
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      cell: ({ row }) => {
        const course = row.original;
        return (
          <div className="max-w-xs truncate">{course.description ?? "N/A"}</div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "isPublished",
      cell: ({ row }) => {
        const course = row.original;
        return (
          <Badge variant={course.isPublished ? "default" : "secondary"}>
            {course.isPublished ? "Published" : "Draft"}
          </Badge>
        );
      },
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
    <AdminLayoutContent withSidebar>
      <AdminLayoutMain>
        <EntityList<CourseData>
          data={courses}
          columns={columns}
          filters={filters}
          hideFilters={true}
          initialFilters={activeFilters}
          onFiltersChange={handleFilterChange}
          isLoading={courses.length === 0}
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

        <DeleteCourseDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          courseTitle={courseToDelete?.title ?? ""}
        />
      </AdminLayoutMain>
      <AdminLayoutSidebar>
        {/* Sidebar content goes here */}
        <Card>
          <CardHeader>
            <CardTitle>Sidebar</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Course Sidebar content</p>
          </CardContent>
        </Card>
      </AdminLayoutSidebar>
    </AdminLayoutContent>
  );
}
