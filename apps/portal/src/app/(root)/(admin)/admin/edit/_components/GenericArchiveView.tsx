"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { ReactNode } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDeletePost, useGetAllPosts } from "@/lib/blog";
import { formatDistanceToNow } from "date-fns";
import { Eye, Info, Plus, Sparkles, Trash2 } from "lucide-react";

import type { ColumnDefinition } from "@acme/ui/entity-list";
import type { EntityAction } from "@acme/ui/entity-list/types";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
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
import { EntityList } from "@acme/ui/entity-list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { toast } from "@acme/ui/toast";

import type { PermalinkSettings } from "./permalink";
import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import { useApplyFilters } from "~/lib/hooks";
import {
  ADMIN_ARCHIVE_CONTENT_AFTER,
  ADMIN_ARCHIVE_CONTENT_BEFORE,
  ADMIN_ARCHIVE_CONTENT_SUPPRESS,
  ADMIN_ARCHIVE_HEADER_AFTER,
  ADMIN_ARCHIVE_HEADER_BEFORE,
  ADMIN_ARCHIVE_HEADER_SUPPRESS,
  ADMIN_ATTACHMENTS_ARCHIVE_TABS_FILTER,
} from "~/lib/plugins/hookSlots";
import { isBuiltInPostTypeSlug } from "~/lib/postTypes/builtIns";
import { buildPermalink } from "./permalink";
import { PlaceholderState } from "./PlaceholderState";

type PostDoc = Doc<"posts">;
type PostTypeDoc = Doc<"postTypes">;

interface ArchiveDisplayRow extends Record<string, unknown> {
  id: string;
  title: string;
  statusLabel: string;
  statusVariant: "default" | "secondary";
  owner: string;
  updatedAt: number;
  permalink?: string;
  isPlaceholder?: boolean;
}

interface PlaceholderRow {
  id: string;
  title: string;
  status: "Published" | "Draft";
  author: string;
  updatedAt: number;
}

const FALLBACK_ROWS: PlaceholderRow[] = Array.from(
  { length: 5 },
  (_, index): PlaceholderRow => ({
    id: `placeholder-${index}`,
    title: `Sample item ${index + 1}`,
    status: index % 2 === 0 ? "Published" : "Draft",
    author: "System",
    updatedAt: Date.now() - index * 1000 * 60 * 60,
  }),
);

type ArchiveRow = PostDoc | PlaceholderRow;

const isPostRow = (row: ArchiveRow): row is PostDoc => "_id" in row;

export interface PluginMenuItem {
  id: string;
  label: string;
  href: string;
}

export interface GenericArchiveViewProps {
  slug: string;
  postType: PostTypeDoc | null;
  options: PostTypeDoc[];
  isLoading: boolean;
  permalinkSettings: PermalinkSettings;
  onPostTypeChange: (slug: string) => void;
  onCreate: () => void;
  renderLayout?: boolean;
  withSidebar?: boolean;
  pluginMenus?: Record<string, PluginMenuItem[]>;
  organizationId?: Id<"organizations">;
}

export function GenericArchiveView({
  slug,
  postType,
  options,
  isLoading,
  permalinkSettings,
  onPostTypeChange,
  onCreate,
  renderLayout = true,
  withSidebar = true,
  pluginMenus,
  organizationId,
}: GenericArchiveViewProps) {
  const searchParams = useSearchParams();
  const label = postType?.name ?? slug.replace(/-/g, " ");
  const description =
    postType?.description ?? "Manage structured entries for this post type.";
  const normalizedSlug = slug.toLowerCase();
  const isAttachmentsArchive = normalizedSlug === "attachments";

  interface AttachmentsArchiveTab {
    id: string;
    label: string;
    order?: number;
    condition?: (ctx: {
      organizationId?: Id<"organizations">;
      postTypeSlug: string;
    }) => boolean;
    component?: (props: { organizationId?: Id<"organizations"> }) => ReactNode;
  }

  const attachmentsHookContext = useMemo(
    () => ({ postTypeSlug: normalizedSlug, organizationId }),
    [normalizedSlug, organizationId],
  );

  const attachmentsTabs = useApplyFilters<AttachmentsArchiveTab[]>(
    ADMIN_ATTACHMENTS_ARCHIVE_TABS_FILTER,
    [
      { id: "list", label: "Attachments", order: 0 },
      { id: "drafts", label: "Drafts", order: 1 },
      { id: "scheduled", label: "Scheduled", order: 2 },
    ],
    attachmentsHookContext,
  );

  const attachmentsTabsFinal = useMemo(() => {
    if (attachmentsTabs.length === 0) {
      return [
        { id: "list", label: "Attachments", order: 0 },
        { id: "drafts", label: "Drafts", order: 1 },
        { id: "scheduled", label: "Scheduled", order: 2 },
      ] satisfies AttachmentsArchiveTab[];
    }

    return [...attachmentsTabs]
      .filter((tab) => !tab.condition || tab.condition(attachmentsHookContext))
      .sort((a, b) => (a.order ?? 10) - (b.order ?? 10));
  }, [attachmentsHookContext, attachmentsTabs]);

  const activeAttachmentsTab = useMemo(() => {
    const raw = searchParams.get("tab");
    const normalized = typeof raw === "string" ? raw.toLowerCase().trim() : "";
    if (!isAttachmentsArchive) return "list";
    if (!normalized) return "list";
    return attachmentsTabsFinal.some((t) => t.id === normalized)
      ? normalized
      : "list";
  }, [attachmentsTabsFinal, isAttachmentsArchive, searchParams]);

  const attachmentsHeaderTabs = useMemo(() => {
    if (!isAttachmentsArchive) return undefined;
    return attachmentsTabsFinal.map((tab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("post_type", "attachments");
      params.set("tab", tab.id);
      params.delete("page");
      return {
        value: tab.id,
        label: tab.label,
        href: `/admin/edit?${params.toString()}`,
        order: tab.order,
      };
    });
  }, [attachmentsTabsFinal, isAttachmentsArchive, searchParams]);

  const shouldLoadPosts =
    Boolean(postType) || isBuiltInPostTypeSlug(normalizedSlug);
  const postsQuery = useGetAllPosts(
    shouldLoadPosts ? { postTypeSlug: normalizedSlug, limit: 200 } : undefined,
  );
  const rows = useMemo<ArchiveRow[]>(() => {
    if (!shouldLoadPosts) {
      return FALLBACK_ROWS;
    }
    return postsQuery.posts as unknown as ArchiveRow[];
  }, [postsQuery.posts, shouldLoadPosts]);
  const tableLoading = shouldLoadPosts ? postsQuery.isLoading : isLoading;
  const displayRows = useMemo<ArchiveDisplayRow[]>(() => {
    return rows.map((row) => {
      if (isPostRow(row)) {
        const statusValue = row.status ?? "draft";
        const statusVariant =
          statusValue === "published" ? "default" : "secondary";
        const updatedValue = row.updatedAt ?? row.createdAt ?? Date.now();
        const permalink = buildPermalink(row, permalinkSettings, postType);
        return {
          id: row._id,
          title: row.title || "Untitled",
          statusLabel: statusValue,
          statusVariant,
          owner: row.authorId ?? "—",
          updatedAt: updatedValue,
          permalink,
        };
      }
      return {
        id: row.id,
        title: row.title,
        statusLabel: row.status,
        statusVariant: row.status === "Published" ? "default" : "secondary",
        owner: row.author,
        updatedAt: row.updatedAt,
        isPlaceholder: true,
      };
    });
  }, [rows, permalinkSettings, postType]);
  const columns = useMemo<ColumnDefinition<ArchiveDisplayRow>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: "Title",
        sortable: true,
        cell: (item: ArchiveDisplayRow) => {
          if (item.permalink) {
            return (
              <Link
                href={`/admin/edit?post_type=${slug}&post_id=${item.id}`}
                className="font-medium hover:underline"
              >
                {item.title}
              </Link>
            );
          }
          return <span className="font-medium">{item.title}</span>;
        },
      },
      {
        id: "statusLabel",
        accessorKey: "statusLabel",
        header: "Status",
        cell: (item: ArchiveDisplayRow) => (
          <Badge variant={item.statusVariant}>{item.statusLabel}</Badge>
        ),
      },
      {
        id: "owner",
        accessorKey: "owner",
        header: "Owner",
        sortable: true,
      },
      {
        id: "updatedAt",
        header: "Updated",
        sortable: true,
        cell: (item: ArchiveDisplayRow) => (
          <span className="text-muted-foreground text-sm">
            {formatDistanceToNow(item.updatedAt, { addSuffix: true })}
          </span>
        ),
      },
    ],
    [slug],
  );
  const deletePost = useDeletePost();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const pendingDeleteItemRef = useRef<ArchiveDisplayRow | null>(null);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const pendingBulkDeleteRef = useRef<{
    selectedItems: ArchiveDisplayRow[];
    clearSelection: () => void;
  } | null>(null);

  const handleDeleteRow = useCallback(
    async (item: ArchiveDisplayRow) => {
      if (item.isPlaceholder) {
        return;
      }
      try {
        await deletePost({
          id: item.id as Id<"posts">,
          postTypeSlug: slug,
          organizationId: organizationId ? String(organizationId) : undefined,
        });
        toast.success("Deleted.");
      } catch (error) {
        toast.error("Failed to delete.", {
          description:
            error instanceof Error ? error.message : "Unexpected error.",
        });
      }
    },
    [deletePost, slug],
  );
  const entityActions = useMemo<EntityAction<ArchiveDisplayRow>[]>(() => {
    const actions: EntityAction<ArchiveDisplayRow>[] = [
      {
        id: "view",
        label: "View",
        icon: <Eye className="h-4 w-4" />,
        onClick: (item) => {
          if (item.permalink) {
            window.open(item.permalink, "_blank", "noopener,noreferrer");
          }
        },
        variant: "ghost",
        isDisabled: (item) => !item.permalink,
      },
    ];

    actions.push({
      id: "delete",
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "destructive",
      isDisabled: (item) => Boolean(item.isPlaceholder),
      onClick: (item) => {
        pendingDeleteItemRef.current = item;
        setConfirmDeleteOpen(true);
      },
    });

    return actions;
  }, [handleDeleteRow]);

  const bulkDeleteSelected = useCallback(
    async (selectedItems: ArchiveDisplayRow[], clearSelection: () => void) => {
      const realItems = selectedItems.filter((item) => !item.isPlaceholder);
      if (realItems.length === 0) return;
      try {
        await Promise.all(
          realItems.map((item) =>
            deletePost({
              id: item.id as unknown as Id<"posts">,
              postTypeSlug: slug,
              organizationId: organizationId
                ? String(organizationId)
                : undefined,
            }),
          ),
        );
        clearSelection();
        toast.success(`Deleted ${realItems.length} item(s).`);
      } catch (error) {
        toast.error("Failed to delete selected items.", {
          description:
            error instanceof Error ? error.message : "Unexpected error.",
        });
      }
    },
    [deletePost, organizationId, slug],
  );

  const archiveHookContext = useMemo<{
    postType: string;
    postTypeDefinition: PostTypeDoc | null;
    layout: "default" | "content-only";
    pluginMenus?: Record<string, PluginMenuItem[]>;
    organizationId?: Id<"organizations">;
  }>(
    () => ({
      postType: slug,
      postTypeDefinition: postType,
      layout: renderLayout ? "default" : "content-only",
      pluginMenus,
      organizationId,
    }),
    [pluginMenus, postType, renderLayout, slug, organizationId],
  );

  const headerBefore = useApplyFilters<ReactNode[]>(
    ADMIN_ARCHIVE_HEADER_BEFORE,
    [],
    archiveHookContext,
  );
  const headerAfter = useApplyFilters<ReactNode[]>(
    ADMIN_ARCHIVE_HEADER_AFTER,
    [],
    archiveHookContext,
  );
  const suppressContent = useApplyFilters<boolean>(
    ADMIN_ARCHIVE_CONTENT_SUPPRESS,
    false,
    archiveHookContext,
  );
  const suppressHeader = useApplyFilters<boolean>(
    ADMIN_ARCHIVE_HEADER_SUPPRESS,
    false,
    archiveHookContext,
  );
  const contentBefore = useApplyFilters<ReactNode[]>(
    ADMIN_ARCHIVE_CONTENT_BEFORE,
    [],
    archiveHookContext,
  );
  const contentAfter = useApplyFilters<ReactNode[]>(
    ADMIN_ARCHIVE_CONTENT_AFTER,
    [],
    archiveHookContext,
  );

  const renderInjectedItems = useCallback(
    (
      items: ReactNode[],
      slot:
        | "admin.archive.header.before"
        | "admin.archive.header.after"
        | "admin.archive.content.before"
        | "admin.archive.content.after",
    ) => {
      if (items.length === 0) {
        return null;
      }
      return (
        <div
          className={`space-y-2 ${
            slot === "admin.archive.content.after" ? "flex flex-1" : ""
          }`}
          data-hook-slot={slot}
        >
          {items.map((node, index) => (
            <div className="flex flex-1" key={`${slot}-${index}`}>
              {node}
            </div>
          ))}
        </div>
      );
    },
    [],
  );

  const mainContent = (
    <div className="container space-y-6 py-6">
      <AlertDialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => {
          setConfirmDeleteOpen(open);
          if (!open) pendingDeleteItemRef.current = null;
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const item = pendingDeleteItemRef.current;
                if (item) void handleDeleteRow(item);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmBulkDeleteOpen}
        onOpenChange={(open) => {
          setConfirmBulkDeleteOpen(open);
          if (!open) pendingBulkDeleteRef.current = null;
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected items?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const payload = pendingBulkDeleteRef.current;
                if (!payload) return;
                void bulkDeleteSelected(payload.selectedItems, payload.clearSelection);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Select value={slug} onValueChange={onPostTypeChange}>
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Select post type" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: PostTypeDoc) => (
              <SelectItem key={option._id} value={option.slug}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="gap-2" type="button" onClick={onCreate}>
          <Plus className="h-4 w-4" /> Add New {label}
        </Button>
      </div>

      {isAttachmentsArchive ? (
        (() => {
          const listTab = (
            <Card>
              <CardHeader>
                <CardTitle>{label} overview</CardTitle>
                <CardDescription>
                  WordPress-style management powered by reusable post type
                  scaffolding.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <EntityList
                  data={displayRows}
                  columns={columns}
                  entityActions={entityActions}
                  isLoading={tableLoading}
                  enableRowSelection
                  enableFooter={false}
                  viewModes={["list", "grid"]}
                  defaultViewMode="list"
                  enableSearch
                  getRowId={(row: ArchiveDisplayRow) => row.id}
                  bulkActions={({
                    selectedItems,
                    clearSelection,
                  }: {
                    selectedItems: ArchiveDisplayRow[];
                    clearSelection: () => void;
                  }) => (
                    <>
                      <div className="text-muted-foreground text-sm">
                        {
                          selectedItems.filter((item) => !item.isPlaceholder)
                            .length
                        }{" "}
                        selected
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          pendingBulkDeleteRef.current = {
                            selectedItems,
                            clearSelection,
                          };
                          setConfirmBulkDeleteOpen(true);
                        }}
                        className="ml-auto"
                      >
                        Delete selected
                      </Button>
                    </>
                  )}
                  emptyState={
                    <div className="text-muted-foreground py-8 text-center">
                      No entries yet. Click “Add New” to get started.
                    </div>
                  }
                  className="p-4"
                />
              </CardContent>
            </Card>
          );

          if (activeAttachmentsTab === "drafts") {
            return <PlaceholderState label="Drafts" />;
          }
          if (activeAttachmentsTab === "scheduled") {
            return <PlaceholderState label="Scheduled" />;
          }
          if (activeAttachmentsTab === "list") {
            return listTab;
          }

          const injected = attachmentsTabsFinal.find(
            (tab) => tab.id === activeAttachmentsTab,
          );
          if (injected?.component) {
            return <>{injected.component({ organizationId })}</>;
          }
          return <PlaceholderState label={injected?.label ?? "Tab"} />;
        })()
      ) : (
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>{label} overview</CardTitle>
                <CardDescription>
                  WordPress-style management powered by reusable post type
                  scaffolding.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <EntityList
                  data={displayRows}
                  columns={columns}
                  entityActions={entityActions}
                  isLoading={tableLoading}
                  enableRowSelection
                  enableFooter={false}
                  viewModes={["list", "grid"]}
                  defaultViewMode="list"
                  enableSearch
                  getRowId={(row: ArchiveDisplayRow) => row.id}
                  bulkActions={({
                    selectedItems,
                    clearSelection,
                  }: {
                    selectedItems: ArchiveDisplayRow[];
                    clearSelection: () => void;
                  }) => (
                    <>
                      <div className="text-muted-foreground text-sm">
                        {
                          selectedItems.filter((item) => !item.isPlaceholder)
                            .length
                        }{" "}
                        selected
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          pendingBulkDeleteRef.current = {
                            selectedItems,
                            clearSelection,
                          };
                          setConfirmBulkDeleteOpen(true);
                        }}
                        className="ml-auto"
                      >
                        Delete selected
                      </Button>
                    </>
                  )}
                  emptyState={
                    <div className="text-muted-foreground py-8 text-center">
                      No entries yet. Click “Add New” to get started.
                    </div>
                  }
                  className="p-4"
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="drafts">
            <PlaceholderState label="Drafts" />
          </TabsContent>
          <TabsContent value="scheduled">
            <PlaceholderState label="Scheduled" />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );

  const headerBeforeContent = renderInjectedItems(
    headerBefore,
    "admin.archive.header.before",
  );
  const headerAfterContent = renderInjectedItems(
    headerAfter,
    "admin.archive.header.after",
  );
  const contentBeforeNodes = renderInjectedItems(
    contentBefore,
    "admin.archive.content.before",
  );
  const contentAfterNodes = renderInjectedItems(
    contentAfter,
    "admin.archive.content.after",
  );

  const contentWithHooks = (
    <>
      {headerBeforeContent}
      {renderLayout && !suppressHeader ? <AdminLayoutHeader /> : null}
      {headerAfterContent}
      {contentBeforeNodes}
      {suppressContent ? null : mainContent}
      {contentAfterNodes}
    </>
  );

  if (!renderLayout) {
    return contentWithHooks;
  }

  return (
    <AdminLayout
      title={`${label} Archive`}
      description={description}
      pathname={`/admin/edit?post_type=${slug}`}
      showTabs={isAttachmentsArchive}
      activeTab={isAttachmentsArchive ? activeAttachmentsTab : undefined}
      tabs={isAttachmentsArchive ? attachmentsHeaderTabs : undefined}
    >
      <AdminLayoutContent
        className="flex flex-1 flex-col"
        withSidebar={withSidebar}
      >
        <AdminLayoutMain className="flex flex-1 flex-col">
          {contentWithHooks}
        </AdminLayoutMain>
        {withSidebar ? (
          <AdminLayoutSidebar className="border-l p-4">
            <DefaultArchiveSidebar />
          </AdminLayoutSidebar>
        ) : null}
      </AdminLayoutContent>
    </AdminLayout>
  );
}

export const DefaultArchiveSidebar = () => (
  <Card>
    <CardHeader className="flex flex-row items-center gap-3">
      <Info className="text-muted-foreground h-5 w-5" />
      <div>
        <CardTitle className="text-base">Need custom fields?</CardTitle>
        <CardDescription>
          Connect post types to marketing tags, menus, and integrations.
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      <Button variant="outline" asChild>
        <Link href="/admin/settings/post-types">
          <Sparkles className="mr-2 h-4 w-4" /> Configure Post Types
        </Link>
      </Button>
      <p className="text-muted-foreground text-sm">
        This scaffold reuses the same Shadcn table primitives as the LMS Courses
        view so every post type feels consistent.
      </p>
    </CardContent>
  </Card>
);
