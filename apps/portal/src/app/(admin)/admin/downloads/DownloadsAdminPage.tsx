"use client";

// Import EntityList components
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Edit, PlusCircle, Trash } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Progress } from "@acme/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Textarea } from "@acme/ui/textarea";

import type { Id } from "../../../../../convex/_generated/dataModel";
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import { formatBytes } from "~/lib/formatBytes";
import { api } from "../../../../../convex/_generated/api";

// Define types for form state
interface UploadFormState {
  title: string;
  description: string;
  categoryId: Id<"downloadCategories"> | null;
  isPublic: boolean;
}

interface CategoryFormState {
  name: string;
  description: string;
  isPublic: boolean;
}

interface EditFormState {
  downloadId: Id<"downloads"> | null;
  title: string;
  description: string;
  categoryId: Id<"downloadCategories"> | null;
  isPublic: boolean;
}

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

export function DownloadsAdminPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  // Check if user is admin
  const isAdminResult = useQuery(api.accessControl.checkIsAdmin);

  // Fetch downloads and categories
  const downloads = useQuery(api.downloadsLibrary.getAllDownloads) as
    | DownloadItem[]
    | undefined;
  const categories = useQuery(api.downloadsLibrary.getDownloadCategories, {
    includePrivate: true,
  });

  // Mutations
  const generateUploadUrl = useMutation(api.downloads.generateUploadUrl);
  const createFileDownload = useMutation(api.downloads.createFileDownload);
  const createCategory = useMutation(
    api.downloadsLibrary.createDownloadCategory,
  );
  const updateDownload = useMutation(api.downloads.updateDownload);
  const removeDownload = useMutation(api.downloads.deleteDownload);

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
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>({
    name: "",
    description: "",
    isPublic: true,
  });
  const [editForm, setEditForm] = useState<EditFormState>({
    downloadId: null,
    title: "",
    description: "",
    categoryId: null,
    isPublic: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!isAuthenticated && !isLoading) {
      router.push("/login");
      return;
    }

    // If authenticated but not admin, redirect to dashboard
    if (isAuthenticated && !isLoading && isAdminResult === false) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router, isAdminResult]);

  // Handle loading state
  if (isLoading || isAdminResult === undefined) {
    return <div className="p-8">Loading...</div>;
  }

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) {
        setSelectedFile(file);
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    try {
      setUploadProgress(10);

      // Get upload URL
      const { uploadUrl, fileId } = (await generateUploadUrl({
        filename: selectedFile.name,
      })) as { uploadUrl: string; fileId: Id<"_storage"> };

      setUploadProgress(30);

      // Upload the file
      const result = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      setUploadProgress(70);

      // Create the download record
      await createFileDownload({
        storageId: fileId,
        title: uploadForm.title,
        description: uploadForm.description,
        categoryId: uploadForm.categoryId ?? undefined,
        isPublic: uploadForm.isPublic,
      });

      setUploadProgress(100);

      // Reset the form
      setUploadForm({
        title: "",
        description: "",
        categoryId: null,
        isPublic: true,
      });
      setSelectedFile(null);
      setUploadDialogOpen(false);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleCategorySubmit = async () => {
    try {
      await createCategory({
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        isPublic: categoryForm.isPublic,
      });

      // Reset the form
      setCategoryForm({
        name: "",
        description: "",
        isPublic: true,
      });
      setCategoryDialogOpen(false);
    } catch (error) {
      console.error("Category creation error:", error);
    }
  };

  const handleEditSubmit = async () => {
    if (!editForm.downloadId) return;

    try {
      await updateDownload({
        downloadId: editForm.downloadId,
        title: editForm.title,
        description: editForm.description,
        categoryId: editForm.categoryId ?? undefined,
        isPublic: editForm.isPublic,
      });

      setEditDialogOpen(false);
    } catch (error) {
      console.error("Edit error:", error);
    }
  };

  const handleDelete = async (downloadId: Id<"downloads">) => {
    if (confirm("Are you sure you want to delete this download?")) {
      try {
        await removeDownload({ downloadId });
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  const handleEditClick = (download: DownloadItem) => {
    setEditForm({
      downloadId: download._id,
      title: download.title,
      description: download.description ?? "",
      categoryId: download.categoryId ?? null,
      isPublic: download.isPublic,
    });
    setEditDialogOpen(true);
  };

  // Define columns for EntityList
  const columns: ColumnDefinition<DownloadItem>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      sortable: true,
    },
    {
      id: "category",
      header: "Category",
      cell: (download) => {
        const category = categories?.find((c) => c._id === download.categoryId);
        return category?.name ?? "Uncategorized";
      },
    },
    {
      id: "fileType",
      header: "Type",
      accessorKey: "fileType",
      sortable: true,
      cell: (download) => <Badge variant="outline">{download.fileType}</Badge>,
    },
    {
      id: "fileSize",
      header: "Size",
      accessorKey: "fileSize",
      sortable: true,
      cell: (download) => formatBytes(download.fileSize),
    },
    {
      id: "downloadCount",
      header: "Downloads",
      accessorKey: "downloadCount",
      sortable: true,
    },
    {
      id: "isPublic",
      header: "Status",
      accessorKey: "isPublic",
      sortable: true,
      cell: (download) => (
        <Badge variant={download.isPublic ? "default" : "secondary"}>
          {download.isPublic ? "Public" : "Private"}
        </Badge>
      ),
    },
  ];

  // Define filter configurations
  const filters: FilterConfig<DownloadItem>[] = [
    {
      id: "title",
      label: "Title",
      type: "text",
      field: "title",
    },
    {
      id: "fileType",
      label: "File Type",
      type: "text",
      field: "fileType",
    },
    {
      id: "isPublic",
      label: "Status",
      type: "select",
      field: "isPublic",
      options: [
        { label: "Public", value: true },
        { label: "Private", value: false },
      ],
    },
  ];

  // Define entity actions
  const entityActions: EntityAction<DownloadItem>[] = [
    {
      id: "edit",
      label: "Edit",
      onClick: handleEditClick,
      variant: "secondary",
      icon: <Edit className="mr-2 h-4 w-4" />,
    },
    {
      id: "delete",
      label: "Delete",
      onClick: (download) => void handleDelete(download._id),
      variant: "destructive",
      icon: <Trash className="mr-2 h-4 w-4" />,
    },
  ];

  // Custom actions for the EntityList header
  const headerActions = (
    <div className="flex space-x-2">
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Add Category</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category for organizing downloads
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={categoryForm.isPublic}
                onCheckedChange={(checked) =>
                  setCategoryForm({
                    ...categoryForm,
                    isPublic: checked as boolean,
                  })
                }
              />
              <label
                htmlFor="isPublic"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Public category
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCategorySubmit}>Create Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New File</DialogTitle>
            <DialogDescription>
              Add a new downloadable file to your library
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">File</Label>
              <Input id="file" type="file" onChange={handleFileChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={uploadForm.title}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) =>
                  setUploadForm({
                    ...uploadForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                onValueChange={(value) =>
                  setUploadForm({
                    ...uploadForm,
                    categoryId:
                      value === "__none__"
                        ? null
                        : (value as Id<"downloadCategories">),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={uploadForm.isPublic}
                onCheckedChange={(checked) =>
                  setUploadForm({
                    ...uploadForm,
                    isPublic: checked as boolean,
                  })
                }
              />
              <label
                htmlFor="isPublic"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Public download
              </label>
            </div>
            {uploadProgress > 0 && (
              <div className="grid gap-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-center text-xs text-muted-foreground">
                  {uploadProgress < 100
                    ? `Uploading ${uploadProgress}%`
                    : "Upload complete!"}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleUploadSubmit}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="container py-6">
      <EntityList<DownloadItem>
        data={downloads ?? []}
        columns={columns}
        filters={filters}
        isLoading={downloads === undefined}
        title="Downloads Management"
        description="Manage downloadable files for your users"
        defaultViewMode="list"
        viewModes={["list"]}
        entityActions={entityActions}
        actions={headerActions}
        emptyState={
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
            <p className="text-muted-foreground">No downloads found</p>
            <Button onClick={() => setUploadDialogOpen(true)} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" /> Upload your first file
            </Button>
          </div>
        }
      />

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Download</DialogTitle>
            <DialogDescription>
              Update the details of this downloadable file
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={editForm.categoryId ?? "__none__"}
                onValueChange={(value) =>
                  setEditForm({
                    ...editForm,
                    categoryId:
                      value === "__none__"
                        ? null
                        : (value as Id<"downloadCategories">),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isPublic"
                checked={editForm.isPublic}
                onCheckedChange={(checked) =>
                  setEditForm({
                    ...editForm,
                    isPublic: checked as boolean,
                  })
                }
              />
              <label
                htmlFor="edit-isPublic"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Public download
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
