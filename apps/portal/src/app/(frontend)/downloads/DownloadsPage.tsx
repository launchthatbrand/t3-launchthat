"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

// Import the EntityList components
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
  FilterValue,
} from "~/components/shared/EntityList/types";
import { DetachableFilters } from "~/components/shared/EntityList/DetachableFilters";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import { formatBytes } from "~/lib/formatBytes";
import { FilePreviewDialog } from "../../_components/downloads/FilePreviewDialog";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

// Define types for search results and download items
interface DownloadItem {
  _id: Id<"downloads">;
  title: string;
  description?: string;
  fileType: string;
  fileSize: number;
  downloadCount: number;
  fileName: string;
}

interface RecentDownloadItem {
  _id: Id<"userDownloads">;
  downloadId: Id<"downloads">;
  downloadedAt: number;
  download: {
    _id: Id<"downloads">;
    title: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  };
}

export function DownloadsPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [_category, _setCategory] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);

  // State for filters
  const [activeFilters, setActiveFilters] = useState<
    Record<string, FilterValue>
  >({});

  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [currentPreviewId, setCurrentPreviewId] =
    useState<Id<"downloads"> | null>(null);
  const [selectedDownloads, setSelectedDownloads] = useState<
    Set<Id<"downloads">>
  >(new Set());

  const _categoriesData = useQuery(api.downloadsLibrary.getDownloadCategories, {
    includePrivate: false,
  });

  const availableFileTypes = useQuery(api.downloads.getAvailableFileTypes);

  const generateDownloadUrlMutation = useMutation(
    api.downloads.generateDownloadUrl,
  );
  const generateMultipleDownloadUrlsMutation = useMutation(
    api.downloads.generateMultipleDownloadUrls,
  );

  // Search parameters
  const [searchParams, setSearchParams] = useState({
    searchTerm: "",
    category: null as string | null,
    fileType: null as string | null,
  });

  // Update search parameters when filters change
  useEffect(() => {
    const filterParams = {
      searchTerm: "",
      category: null as string | null,
      fileType: null as string | null,
    };

    // Map filter values to search parameters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (key === "title" && typeof value === "string") {
        filterParams.searchTerm = value;
      } else if (key === "fileType" && typeof value === "string") {
        filterParams.fileType = value;
      }
    });

    setSearchParams(filterParams);
    setSearchTerm(filterParams.searchTerm);
    setFileType(filterParams.fileType);
  }, [activeFilters]);

  // Search query without cursor-based pagination
  const searchResults = useQuery(api.downloadsLibrary.searchAllDownloads, {
    searchTerm: searchParams.searchTerm || undefined,
    categoryId: searchParams.category
      ? (searchParams.category as Id<"downloadCategories">)
      : undefined,
    fileType: searchParams.fileType ?? undefined,
  }) as { downloads: DownloadItem[] } | undefined;

  const recentDownloads = useQuery(
    api.downloadsLibrary.getRecentDownloads,
    !authLoading && isAuthenticated ? { limit: 5 } : "skip",
  ) as RecentDownloadItem[] | undefined;

  const recommendations = useQuery(
    api.downloadsLibrary.getDownloadRecommendations,
    { count: 4 },
  );

  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!isAuthenticated && !authLoading) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Handle loading state
  if (authLoading) {
    return <div className="p-8">Loading...</div>;
  }

  // Show loading state when search params change and query is skipped
  const isSearching = searchResults === undefined;

  const handleDownload = async (
    downloadId: Id<"downloads">,
    fileName: string,
  ) => {
    try {
      const url = await generateDownloadUrlMutation({ downloadId });
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error("Download error:", error);
      // TODO: Show user-friendly error
    }
  };

  const handleToggleSelection = (downloadId: Id<"downloads">) => {
    setSelectedDownloads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(downloadId)) {
        newSet.delete(downloadId);
      } else {
        newSet.add(downloadId);
      }
      return newSet;
    });
  };

  const handleBulkDownload = async () => {
    if (selectedDownloads.size === 0) return;
    try {
      const urls = await generateMultipleDownloadUrlsMutation({
        downloadIds: Array.from(selectedDownloads),
      });
      urls.forEach(
        (result: { url?: string; fileName?: string; error?: string }) => {
          if (result.url && result.fileName) {
            const link = document.createElement("a");
            link.href = result.url;
            link.setAttribute("download", result.fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
          } else if (result.error) {
            console.error(
              `Error downloading ${result.fileName}: ${result.error}`,
            );
            // TODO: Show user-friendly error for individual failed downloads
          }
        },
      );
      setSelectedDownloads(new Set()); // Clear selection after attempting download
    } catch (error) {
      console.error("Bulk download error:", error);
      // TODO: Show user-friendly error
    }
  };

  const handlePreview = (downloadId: Id<"downloads">) => {
    setCurrentPreviewId(downloadId);
    setPreviewDialogOpen(true);
  };

  // Define column configurations for EntityList
  const columns: ColumnDefinition<DownloadItem>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      sortable: true,
    },
    {
      id: "fileType",
      header: "Type",
      accessorKey: "fileType",
      sortable: true,
      cell: (item) => <Badge variant="outline">{item.fileType}</Badge>,
    },
    {
      id: "fileSize",
      header: "Size",
      accessorKey: "fileSize",
      sortable: true,
      cell: (item) => formatBytes(item.fileSize),
    },
    {
      id: "downloadCount",
      header: "Downloads",
      accessorKey: "downloadCount",
      sortable: true,
    },
  ];

  // Define filter configurations for EntityList
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
      type: "select",
      field: "fileType",
      options:
        availableFileTypes?.map((ft) => ({
          label: ft.description,
          value: ft.type,
        })) ?? [],
    },
    {
      id: "fileSize",
      label: "File Size",
      type: "number",
      field: "fileSize",
    },
    {
      id: "downloadCount",
      label: "Download Count",
      type: "number",
      field: "downloadCount",
    },
  ];

  // Define entity actions for the EntityList
  const entityActions: EntityAction<DownloadItem>[] = [
    {
      id: "preview",
      label: "Preview",
      onClick: (item) => handlePreview(item._id),
      variant: "outline",
    },
    {
      id: "download",
      label: "Download",
      onClick: (item) => {
        void handleDownload(item._id, item.fileName);
      },
      variant: "secondary",
    },
    {
      id: "select",
      label: selectedDownloads.size > 0 ? "Deselect" : "Select",
      onClick: (item) => handleToggleSelection(item._id),
      variant: "ghost",
      isDisabled: false,
    },
  ];

  // Handle filter changes
  const handleFilterChange = (newFilters: Record<string, FilterValue>) => {
    setActiveFilters(newFilters);
  };

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Downloads</h1>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="browse">Browse Downloads</TabsTrigger>
          <TabsTrigger value="recent">Recent Downloads</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Detached filters at the top of the page */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-medium">Filter Downloads</h3>
            <DetachableFilters
              filters={filters}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
            />
          </div>

          {selectedDownloads.size > 0 && (
            <div className="my-4 flex justify-end">
              <Button onClick={() => void handleBulkDownload()}>
                Download Selected ({selectedDownloads.size})
              </Button>
            </div>
          )}

          {/* EntityList with hidden internal filters */}
          <EntityList<DownloadItem>
            data={searchResults?.downloads ?? []}
            columns={columns}
            filters={filters}
            hideFilters={true}
            initialFilters={activeFilters}
            onFiltersChange={handleFilterChange}
            isLoading={isSearching}
            title="Downloads Library"
            description="Browse and filter available downloads"
            defaultViewMode="grid"
            viewModes={["list", "grid"]}
            entityActions={entityActions}
            emptyState={
              <div className="mt-8 flex h-32 flex-col items-center justify-center space-y-2">
                <p className="text-muted-foreground">No downloads found</p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="recent">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Recent Downloads</h2>
            {recentDownloads?.length === 0 ? (
              <p className="text-muted-foreground">
                You haven't downloaded any files yet
              </p>
            ) : (
              <div className="divide-y rounded-md border">
                {recentDownloads?.map((item: RecentDownloadItem) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-4"
                  >
                    <div>
                      <p className="font-medium">{item.download.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.downloadedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void handleDownload(
                          item.downloadId,
                          item.download.fileName,
                        )
                      }
                    >
                      Download Again
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Recommended Downloads Section */}
      {recommendations && recommendations.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-2xl font-semibold">Recommended For You</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {recommendations.map((rec) => (
              <Card key={rec._id}>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{rec.title}</CardTitle>
                  <CardDescription className="line-clamp-2 h-[40px] overflow-hidden">
                    {rec.description ?? ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">{rec.fileType}</Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handlePreview(rec._id)}
                  >
                    Preview
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => void handleDownload(rec._id, rec.fileName)}
                  >
                    Download
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      <FilePreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        downloadId={currentPreviewId}
      />
    </div>
  );
}
