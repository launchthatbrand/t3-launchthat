"use client";

import {
  AdminLayoutContent,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Eye, Info, Loader2, Plus, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";
import Link from "next/link";
import type { PermalinkSettings } from "./permalink";
import { PlaceholderState } from "./PlaceholderState";
import type { ReactNode } from "react";
import { buildPermalink } from "./permalink";
import { formatDistanceToNow } from "date-fns";
import { getCanonicalPostPath } from "~/lib/postTypes/routing";
import { isBuiltInPostTypeSlug } from "~/lib/postTypes/builtIns";
import { useGetAllPosts } from "@/lib/blog";

type PostDoc = Doc<"posts">;
type PostTypeDoc = Doc<"postTypes">;

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
}

export function GenericArchiveView({
  slug,
  postType,
  options,
  isLoading,
  permalinkSettings,
  onPostTypeChange,
  onCreate,
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

  return (
    <AdminLayoutContent withSidebar>
      <AdminLayoutMain>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Admin / Edit</p>
              <h1 className="text-3xl font-bold">{label}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={slug} onValueChange={onPostTypeChange}>
                <SelectTrigger className="w-[200px]">
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
                <CardContent>
                  {tableLoading ? (
                    <div className="flex h-32 items-center justify-center text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
                      entries…
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead className="text-right">Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">
                              No entries yet. Click “Add New” to get started.
                            </TableCell>
                          </TableRow>
                        ) : (
                          rows.map((row) =>
                            isPostRow(row) ? (
                              <PostRow
                                key={row._id}
                                row={row}
                                slug={slug}
                                permalinkSettings={permalinkSettings}
                                postType={postType}
                              />
                            ) : (
                              <PlaceholderArchiveRow key={row.id} row={row} />
                            ),
                          )
                        )}
                      </TableBody>
                    </Table>
                  )}
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
      </AdminLayoutMain>
      <AdminLayoutSidebar>
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Info className="h-5 w-5 text-muted-foreground" />
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
            <p className="text-sm text-muted-foreground">
              This scaffold reuses the same Shadcn table primitives as the LMS
              Courses view so every post type feels consistent.
            </p>
          </CardContent>
        </Card>
      </AdminLayoutSidebar>
    </AdminLayoutContent>
  );
}

interface PostRowProps {
  row: PostDoc;
  slug: string;
  permalinkSettings: PermalinkSettings;
  postType?: PostTypeDoc | null;
}

const PostRow = ({ row, slug, permalinkSettings, postType }: PostRowProps) => {
  const statusValue = row.status ?? "draft";
  const updatedValue = row.updatedAt ?? row.createdAt ?? Date.now();
  const permalink = buildPermalink(row, permalinkSettings, postType);

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link
          href={`/admin/edit?post_type=${slug}&post_id=${row._id}`}
          className="hover:underline"
        >
          {row.title || "Untitled"}
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant={statusValue === "published" ? "default" : "secondary"}>
          {statusValue}
        </Badge>
      </TableCell>
      <TableCell>{row.authorId ?? "—"}</TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">
        {formatDistanceToNow(updatedValue, { addSuffix: true })}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon" asChild>
          <Link href={permalink} target="_blank" rel="noreferrer">
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
};

const PlaceholderArchiveRow = ({ row }: { row: PlaceholderRow }) => (
  <TableRow>
    <TableCell className="font-medium">{row.title}</TableCell>
    <TableCell>
      <Badge variant={row.status === "Published" ? "default" : "secondary"}>
        {row.status}
      </Badge>
    </TableCell>
    <TableCell>{row.author}</TableCell>
    <TableCell className="text-right text-sm text-muted-foreground">
      {formatDistanceToNow(row.updatedAt, { addSuffix: true })}
    </TableCell>
    <TableCell className="text-right text-sm text-muted-foreground">
      —
    </TableCell>
  </TableRow>
);
