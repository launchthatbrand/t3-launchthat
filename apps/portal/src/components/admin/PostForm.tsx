/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";

import { Editor } from "~/components/blocks/editor-x/editor";

export interface PostFormData {
  title: string;
  slug?: string;
  status?: "draft" | "published" | "archived";
  authorId?: Id<"users">;
  category?: string;
  tags: string[];
  excerpt?: string;
  content: string;
  featuredImageUrl?: string;
  featured?: boolean;
  readTime?: string;
}

interface PostFormProps {
  initial?: Partial<PostFormData>;
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
}

export function PostForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitButtonText = "Create Post",
}: PostFormProps) {
  const { isLoaded: isAuthLoaded } = useAuth();
  const users = useQuery(
    api.users.queries.listUsers,
    isAuthLoaded ? {} : "skip",
  );

  const [form, setForm] = useState<PostFormData>({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    status: initial?.status ?? "draft",
    authorId: initial?.authorId,
    category: initial?.category ?? "",
    tags: initial?.tags ?? [],
    excerpt: initial?.excerpt ?? "",
    content: initial?.content ?? "",
    featuredImageUrl: initial?.featuredImageUrl ?? "",
    featured: initial?.featured ?? false,
    readTime: initial?.readTime ?? "",
  });

  const handleChange = (key: keyof PostFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value as never }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  // Parse initial/editor state if content contains a serialized editor state
  const parsedEditorState = (() => {
    if (!form.content) return undefined;
    try {
      return JSON.parse(form.content);
    } catch {
      return undefined;
    }
  })();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => handleChange("slug", e.target.value)}
              placeholder="auto-generated if empty"
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                handleChange("status", v as PostFormData["status"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="author">Author</Label>
            <Select
              value={form.authorId ?? "none"}
              onValueChange={(v) =>
                handleChange(
                  "authorId",
                  v === "none" ? undefined : (v as Id<"users">),
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select author" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {Array.isArray(users) &&
                  users.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.firstName ?? u.name ?? "User"} {u.lastName ?? ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={form.tags.join(", ")}
              onChange={(e) =>
                handleChange(
                  "tags",
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={form.excerpt}
              onChange={(e) => handleChange("excerpt", e.target.value)}
              rows={3}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Content</Label>
            <Editor
              editorSerializedState={parsedEditorState}
              onSerializedChange={(state) =>
                handleChange("content", JSON.stringify(state))
              }
            />
          </div>
          <div>
            <Label htmlFor="featuredImageUrl">Featured Image URL</Label>
            <Input
              id="featuredImageUrl"
              value={form.featuredImageUrl}
              onChange={(e) => handleChange("featuredImageUrl", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="readTime">Read Time</Label>
            <Input
              id="readTime"
              value={form.readTime}
              onChange={(e) => handleChange("readTime", e.target.value)}
              placeholder="e.g., 5 min"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={!!form.featured}
              onCheckedChange={(v) => handleChange("featured", v)}
            />
            <Label>Featured</Label>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : submitButtonText}
        </Button>
      </div>
    </form>
  );
}
