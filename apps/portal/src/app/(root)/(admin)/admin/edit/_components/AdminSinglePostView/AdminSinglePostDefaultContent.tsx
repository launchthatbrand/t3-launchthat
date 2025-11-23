"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  ExternalLink,
  Loader2,
  Pencil,
  Sparkles,
} from "lucide-react";
import type { ReactNode, RefObject } from "react";

import { Button } from "@acme/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import Link from "next/link";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";

interface AdminSinglePostDefaultContentProps {
  headerLabel: string;
  postTypeSlug: string;
  saveError: string | null;
  title: string;
  onTitleChange: (value: string) => void;
  supportsPostsTable: boolean;
  isSlugEditing: boolean;
  onSlugEditingChange: (value: boolean) => void;
  slugValue: string;
  onSlugValueChange: (value: string) => void;
  initialSlugValue: string;
  slugInputRef: RefObject<HTMLInputElement | null>;
  slugPreviewUrl: string | null;
  isPublished: boolean;
  onPublishedChange: (value: boolean) => void;
  content: string;
  onContentChange: (value: string) => void;
  excerpt: string;
  onExcerptChange: (value: string) => void;
  postTypeFieldsLoading: boolean;
  sortedCustomFields: Doc<"postTypeFields">[];
  renderCustomFieldControl: (field: Doc<"postTypeFields">) => ReactNode;
  puckDataJson: string;
}

export function AdminSinglePostDefaultContent({
  headerLabel,
  postTypeSlug,
  saveError,
  title,
  onTitleChange,
  supportsPostsTable,
  isSlugEditing,
  onSlugEditingChange,
  slugValue,
  onSlugValueChange,
  initialSlugValue,
  slugInputRef,
  slugPreviewUrl,
  isPublished,
  onPublishedChange,
  content,
  onContentChange,
  excerpt,
  onExcerptChange,
  postTypeFieldsLoading,
  sortedCustomFields,
  renderCustomFieldControl,
  puckDataJson,
}: AdminSinglePostDefaultContentProps) {
  return (
    <div className="space-y-6">
      {saveError && <p className="text-sm text-destructive">{saveError}</p>}
      <Card className="relative">
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Fundamental settings for this {headerLabel} entry.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="post-title">Title</Label>
            <Input
              id="post-title"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Add a descriptive title"
            />
          </div>
          {supportsPostsTable ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="post-slug">Frontend Slug</Label>
                {!isSlugEditing ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onSlugEditingChange(true)}
                    className="text-xs"
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </Button>
                ) : null}
              </div>
              {isSlugEditing ? (
                <Input
                  id="post-slug"
                  ref={slugInputRef}
                  value={slugValue}
                  onChange={(event) => onSlugValueChange(event.target.value)}
                  placeholder="friendly-url-slug"
                  onBlur={() => onSlugEditingChange(false)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      slugInputRef.current?.blur();
                    }
                    if (event.key === "Escape") {
                      event.preventDefault();
                    onSlugValueChange(initialSlugValue);
                      onSlugEditingChange(false);
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm">
                  {slugPreviewUrl ? (
                    <a
                      className="min-w-0 flex-1 truncate font-medium text-primary hover:underline"
                      href={slugPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {slugPreviewUrl}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">
                      Slug will be generated after saving.
                    </span>
                  )}
                  {slugPreviewUrl ? (
                    <a
                      href={slugPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                      aria-label="Open public page"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Must be unique; determines the public URL.
              </p>
            </div>
          ) : null}
          <div className="absolute right-6 top-0 space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Published</p>
                <p className="text-xs text-muted-foreground">
                  Toggle visibility for this entry.
                </p>
              </div>
              <Switch
                id="post-status"
                checked={isPublished}
                onCheckedChange={onPublishedChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-content">Content</Label>
            <Textarea
              id="post-content"
              rows={8}
              value={content}
              onChange={(event) => onContentChange(event.target.value)}
              placeholder="Compose the main body content"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-excerpt">Excerpt</Label>
            <Textarea
              id="post-excerpt"
              rows={3}
              value={excerpt}
              onChange={(event) => onExcerptChange(event.target.value)}
              placeholder="Short summary for listing views"
            />
          </div>
        </CardContent>
      </Card>
      {postTypeFieldsLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Custom Fields</CardTitle>
            <CardDescription>Loading field definitions…</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching the latest custom fields for this post type.
          </CardContent>
        </Card>
      ) : sortedCustomFields.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Custom Fields</CardTitle>
            <CardDescription>
              These fields come from Post Type settings and save into post_meta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sortedCustomFields.map((field) => (
              <div key={field._id} className="space-y-2 rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor={`custom-field-${field._id}`}>
                    {field.name}
                    {field.required ? " *" : ""}
                  </Label>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {field.type}
                  </span>
                </div>
                {field.description ? (
                  <p className="text-sm text-muted-foreground">
                    {field.description}
                  </p>
                ) : null}
                {renderCustomFieldControl(field)}
              </div>
            ))}
            <div className="space-y-2 rounded-md border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="custom-field-puck-data">Puck Data (JSON)</Label>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  system
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Read-only representation of the stored Puck layout. Updates are
                managed automatically when using the Puck editor.
              </p>
              <Textarea
                id="custom-field-puck-data"
                value={puckDataJson}
                readOnly
                rows={8}
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Need custom fields?</CardTitle>
              <CardDescription>
                Connect this post type to marketing tags, menu builders, or
                plugin data by defining post_meta keys.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" asChild>
              <Link
                href={`/admin/settings/post-types?tab=fields&post_type=${postTypeSlug}`}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Configure Fields
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Custom fields mirror WordPress&apos; post_meta table so plugins can
              rely on a familiar contract.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

