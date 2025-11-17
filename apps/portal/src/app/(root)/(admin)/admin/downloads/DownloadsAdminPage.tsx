"use client";

// Import EntityList components
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  Download,
  Edit,
  FileText,
  MoreHorizontal,
  PlusCircle,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import { MultiSelect } from "@acme/ui/components/multi-select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Progress } from "@acme/ui/progress";
import { toast } from "@acme/ui/toast";

import type { Id } from "../../../../../../convex/_generated/dataModel";
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import { api } from "../../../../../../convex/_generated/api";

// Define types for form state
interface UploadFormState {
  title: string;
  description: string;
  categoryId: Id<"downloadCategories"> | null;
  isPublic: boolean;
}

// interface CategoryFormState {
//   name: string;
//   description: string;
//   isPublic: boolean;
// }

// interface EditFormState {
//   downloadId: Id<"downloads"> | null;
//   title: string;
//   description: string;
//   categoryId: Id<"downloadCategories"> | null;
//   isPublic: boolean;
// }

// Use a more general type to handle the inconsistency between different download return types
interface DownloadItem {
  _id: Id<"downloads">;
  title: string;
  description?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  downloadCount: number;
  categoryId?: Id<"downloadCategories">;
  isPublic: boolean;
  [key: string]: unknown; // Allow any additional properties
}

interface CategoryItem {
  _id: Id<"downloadCategories">;
  name: string;
  description?: string;
  isPublic?: boolean;
  _creationTime?: number;
}

interface UploadResponseData {
  storageId: Id<"_storage">;
}

export function DownloadsAdminPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const ensureUser = useMutation(api.core.users.createOrGetUser);

  // Early return if auth is loading or user is not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("You must be logged in to access this page.");
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="container p-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Authenticating...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // This state should ideally be brief due to the useEffect redirect,
    // but it's a safeguard.
    return (
      <div className="container p-8">
        <p className="text-center text-muted-foreground">
          Redirecting to login...
        </p>
      </div>
    );
  }

  // At this point, isAuthenticated is true and authLoading is false.
  // We can now safely call hooks that depend on authentication.
  return (
    <AuthenticatedDownloadsAdminPage ensureUser={ensureUser} router={router} />
  );
}

// New component to house the logic that runs only when authenticated
function AuthenticatedDownloadsAdminPage({
  ensureUser,
  router,
}: {
  ensureUser: ReturnType<
    typeof useMutation<typeof api.core.users.createOrGetUser>
  >;
  router: ReturnType<typeof useRouter>;
}) {
  const isAdminResult = useQuery(api.accessControl.checkIsAdmin);

  useEffect(() => {
    ensureUser().catch((error) => {
      console.error("Failed to ensure user exists:", error);
      toast.error("Error verifying user session. Please try logging in again.");
    });
  }, [ensureUser]);

  useEffect(() => {
    if (isAdminResult === false) {
      toast.error("You are not authorized to view this page.");
      router.push("/dashboard");
    }
  }, [isAdminResult, router]);

  if (isAdminResult === undefined) {
    return (
      <div className="container p-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Verifying admin status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAdminResult === false) {
    return (
      <div className="container p-8">
        <p className="text-center text-muted-foreground">Redirecting...</p>
      </div>
    );
  }
  // At this point, isAdminResult is true.
  return <DownloadsAdminContent router={router} />;
}

// New component specifically for when user is authenticated AND admin
function DownloadsAdminContent({
  router,
}: {
  router: ReturnType<typeof useRouter>;
}) {
  const [dataError, setDataError] = useState<Error | null>(null);

  const downloadsData = useQuery(api.downloadsLibrary.getAllDownloads, {}) as
    | DownloadItem[]
    | undefined;
  const categoriesData = useQuery(api.downloadsLibrary.getDownloadCategories, {
    includePrivate: true,
  }) as CategoryItem[] | undefined;

  const downloadsLoading = downloadsData === undefined && !dataError;
  const categoriesLoading = categoriesData === undefined && !dataError;

  const generateUploadUrl = useMutation(api.downloads.generateUploadUrl);
  const createFileDownload = useMutation(api.downloads.createFileDownload);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [uploadForm, setUploadForm] = useState<UploadFormState>({
    title: "",
    description: "",
    categoryId: null,
    isPublic: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // For category filter using MultiSelect
  const [_selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    let errorOccurred = false;
    if (downloadsData === undefined && !downloadsLoading) {
      setDataError(new Error("Failed to load downloads data."));
      errorOccurred = true;
    }
    if (categoriesData === undefined && !categoriesLoading) {
      setDataError(new Error("Failed to load categories data."));
      errorOccurred = true;
    }
    if (!errorOccurred) setDataError(null); // Clear error if data loads
  }, [downloadsData, categoriesData, downloadsLoading, categoriesLoading]);

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      /* ... */ return;
    }
    if (!uploadForm.title) {
      /* ... */ return;
    }
    try {
      setUploadProgress(10);
      const postUrl = await generateUploadUrl({ filename: selectedFile.name });
      if (!postUrl) {
        throw new Error("Failed to get upload URL");
      }
      setUploadProgress(30);
      const uploadResponse = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${await uploadResponse.text()}`);
      }
      setUploadProgress(70);
      const responseData = (await uploadResponse.json()) as UploadResponseData;
      if (typeof responseData.storageId !== "string") {
        throw new Error(
          "Invalid upload response: storageId not found or not a string.",
        );
      }
      const storageId = responseData.storageId;
      await createFileDownload({
        storageId,
        title: uploadForm.title,
        description: uploadForm.description,
        categoryId:
          uploadForm.categoryId === "__none__" || uploadForm.categoryId === null
            ? undefined
            : uploadForm.categoryId,
        isPublic: uploadForm.isPublic,
      });
      setUploadProgress(100);
      toast.success("File uploaded!");
      setUploadDialogOpen(false);
      setUploadForm({
        title: "",
        description: "",
        categoryId: null,
        isPublic: true,
      });
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(error instanceof Error ? error.message : "Upload error");
      setUploadProgress(0);
    }
  };

  // Column definitions
  const columns: ColumnDefinition<DownloadItem>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      cell: (row) => (
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.title}</span>
        </div>
      ),
      sortable: true,
    },
    {
      id: "fileType",
      header: "Type",
      accessorKey: "fileType",
      cell: (row) => <span>{row.fileType.toUpperCase()}</span>,
      sortable: true,
    },
    {
      id: "fileSize",
      header: "Size",
      accessorKey: "fileSize",
      cell: (row) => {
        // Convert bytes to KB or MB
        const sizeInKB = row.fileSize / 1024;
        if (sizeInKB < 1024) {
          return <span>{sizeInKB.toFixed(2)} KB</span>;
        } else {
          const sizeInMB = sizeInKB / 1024;
          return <span>{sizeInMB.toFixed(2)} MB</span>;
        }
      },
      sortable: true,
    },
    {
      id: "category",
      header: "Category",
      accessorKey: "categoryId",
      cell: (row) => {
        const category = categoriesData?.find(
          (cat) => cat._id === row.categoryId,
        );
        return <span>{category?.name ?? "Uncategorized"}</span>;
      },
      sortable: true,
    },
    {
      id: "downloads",
      header: "Downloads",
      accessorKey: "downloadCount",
      cell: (row) => <span className="font-mono">{row.downloadCount}</span>,
      sortable: true,
    },
    {
      id: "isPublic",
      header: "Visibility",
      accessorKey: "isPublic",
      cell: (row) => (
        <span className={row.isPublic ? "text-green-600" : "text-amber-600"}>
          {row.isPublic ? "Public" : "Private"}
        </span>
      ),
      sortable: true,
    },
  ];

  // Filter configurations
  const filters: FilterConfig<DownloadItem>[] = [
    {
      id: "fileType",
      label: "File Type",
      type: "select",
      field: "fileType",
      options: Array.from(
        new Set((downloadsData ?? []).map((d) => d.fileType)),
      ).map((type) => ({
        label: type.toUpperCase(),
        value: type,
      })),
    },
    {
      id: "category",
      label: "Category",
      type: "select",
      field: "categoryId",
      options: [
        { label: "Uncategorized", value: "__none__" },
        ...(categoriesData ?? []).map((cat) => ({
          label: cat.name,
          value: cat._id,
        })),
      ],
    },
    {
      id: "visibility",
      label: "Visibility",
      type: "select",
      field: "isPublic",
      options: [
        { label: "Public", value: true },
        { label: "Private", value: false },
      ],
    },
  ];

  // Delete download mutation
  const deleteDownload = useMutation(api.downloads.deleteDownload);

  // Get download URL mutation
  const getDownloadUrl = useMutation(api.downloads.generateDownloadUrl);

  // Handle download
  const handleDownload = async (downloadId: Id<"downloads">) => {
    try {
      const url = await getDownloadUrl({ downloadId });
      if (url) {
        window.open(url, "_blank");
      } else {
        toast.error("Failed to generate download link.");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file.");
    }
  };

  // Handle delete
  const handleDelete = async (downloadId: Id<"downloads">) => {
    try {
      await deleteDownload({ downloadId });
      toast.success("File deleted successfully.");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete file.");
    }
  };

  // Entity actions
  const entityActions: EntityAction<DownloadItem>[] = [
    {
      id: "edit",
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
      onClick: () => {
        setEditDialogOpen(true);
      },
      variant: "outline",
    },
    {
      id: "download",
      label: "Download",
      icon: <Download className="h-4 w-4" />,
      onClick: (item: DownloadItem) => {
        void handleDownload(item._id);
      },
      variant: "outline",
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (item: DownloadItem) => {
        void handleDelete(item._id);
      },
      variant: "destructive",
    },
  ];

  // Header actions
  const headerActions = (
    <div className="flex gap-2">
      <Button variant="outline" asChild>
        <Link href="/admin/downloads/create">
          <PlusCircle className="mr-2 h-4 w-4" />
          Upload
        </Link>
      </Button>

      <Button variant="outline" asChild>
        <Link href="/admin/downloads/category">
          <PlusCircle className="mr-2 h-4 w-4" />
          Category
        </Link>
      </Button>
    </div>
  );

  if (downloadsLoading || categoriesLoading) {
    return (
      <div className="container p-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Loading admin content...</p>
          </div>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="container p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-destructive">
            Error Loading Content
          </h1>
          <p className="text-muted-foreground">{dataError.message}</p>
          <Button onClick={() => router.refresh()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Main component JSX
  return (
    <div className="container py-6">
      <EntityList<DownloadItem>
        data={downloadsData ?? []}
        columns={columns}
        filters={filters}
        isLoading={downloadsLoading}
        title="Downloads Management"
        description="Manage downloadable files for your users"
        defaultViewMode="list"
        viewModes={["list"]}
        entityActions={entityActions}
        actions={headerActions}
        emptyState={
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <UploadCloud className="mb-2 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-1 text-lg font-medium">No downloads found</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Upload your first file to get started.
            </p>
            <Button variant="outline" asChild>
              <Link href="/admin/downloads/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Upload File
              </Link>
            </Button>
          </div>
        }
      />

      {/* We don't need the upload dialog anymore since we're navigating to a dedicated page */}

      {/* Category Dialog is now part of headerActions */}

      {/* Edit Dialog remains separate if triggered by entity actions */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Download</DialogTitle>
          </DialogHeader>
          {/* TODO: Add form for editing download here */}
          <p>Edit form content will go here.</p>
          <DialogFooter>
            <Button onClick={() => setEditDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={() => {
                /* handleEditSubmit(); */ setEditDialogOpen(false);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
