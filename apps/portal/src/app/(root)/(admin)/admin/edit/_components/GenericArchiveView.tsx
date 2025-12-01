"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { useMemo } from "react";
import Link from "next/link";
import { useGetAllPosts } from "@/lib/blog";
import { formatDistanceToNow } from "date-fns";
import { Eye, Info, Plus, Sparkles } from "lucide-react";

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
import { EntityList } from "@acme/ui/entity-list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { PermalinkSettings } from "./permalink";
import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
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

export interface GenericArchiveViewProps {
  slug: string;
  postType: PostTypeDoc | null;
  options: PostTypeDoc[];
  isLoading: boolean;
  permalinkSettings: PermalinkSettings;
  onPostTypeChange: (slug: string) => void;
  onCreate: () => void;
  renderLayout?: boolean;
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
}: GenericArchiveViewProps) {
  const label = postType?.name ?? slug.replace(/-/g, " ");
  const description =
    postType?.description ?? "Manage structured entries for this post type.";
  const normalizedSlug = slug.toLowerCase();
  const shouldLoadPosts = postType
    ? true
    : isBuiltInPostTypeSlug(normalizedSlug);
  const { posts, isLoading: postsLoading } = useGetAllPosts(
    shouldLoadPosts ? { postTypeSlug: normalizedSlug } : undefined,
  );
  const rows: ArchiveRow[] = shouldLoadPosts
    ? (posts as ArchiveRow[])
    : FALLBACK_ROWS;
  const tableLoading = shouldLoadPosts ? postsLoading : isLoading;
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
        cell: (item) => {
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
        cell: (item) => (
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
        cell: (item) => (
          <span className="text-muted-foreground text-sm">
            {formatDistanceToNow(item.updatedAt, { addSuffix: true })}
          </span>
        ),
      },
    ],
    [slug],
  );
  const entityActions = useMemo<EntityAction<ArchiveDisplayRow>[]>(
    () => [
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
    ],
    [],
  );

  const mainContent = (
    <div className="container space-y-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Select value={slug} onValueChange={onPostTypeChange}>
          <SelectTrigger className="w-[240px]">
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
                enableFooter={false}
                viewModes={["list"]}
                defaultViewMode="list"
                enableSearch
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
    </div>
  );

  if (!renderLayout) {
    return mainContent;
  }

  return (
    <AdminLayout
      title={`${label} Archive`}
      description={description}
      pathname={`/admin/edit?post_type=${slug}`}
    >
      <AdminLayoutContent withSidebar>
        <AdminLayoutMain>
          <AdminLayoutHeader />
          {mainContent}
        </AdminLayoutMain>
        <AdminLayoutSidebar className="border-l p-4">
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
                This scaffold reuses the same Shadcn table primitives as the LMS
                Courses view so every post type feels consistent.
              </p>
            </CardContent>
          </Card>
        </AdminLayoutSidebar>
      </AdminLayoutContent>
    </AdminLayout>
  );
}
