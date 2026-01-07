/* eslint-disable @typescript-eslint/no-unsafe-return */
 
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import type { UseFormReturn } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { api } from "@convex-config/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { useForm } from "react-hook-form";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
// import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";

import { useAdminPost } from "~/components/admin/AdminSinglePostLayout";
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
  title?: string;
  formApi?: UseFormReturn<PostFormData>;
}

export function PostForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitButtonText = "Create Post",
  title = "Post",
  formApi,
}: PostFormProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const canLoadUsers = !isAuthLoading && isAuthenticated;
  const users = useQuery(
    api.core.users.queries.listUsers,
    canLoadUsers ? {} : "skip",
  );

  const internalForm = useForm<PostFormData>({
    defaultValues: {
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
    },
    mode: "onChange",
  });

  const form = formApi ?? internalForm;
  const isExternal = !!formApi;

  // Reset form when initial data changes
  useEffect(() => {
    if (initial) {
      form.reset({
        title: initial.title ?? "",
        slug: initial.slug ?? "",
        status: initial.status ?? "draft",
        authorId: initial.authorId,
        category: initial.category ?? "",
        tags: initial.tags ?? [],
        excerpt: initial.excerpt ?? "",
        content: initial.content ?? "",
        featuredImageUrl: initial.featuredImageUrl ?? "",
        featured: initial.featured ?? false,
        readTime: initial.readTime ?? "",
      });
    }
  }, [initial, form]);

  // Header save registration
  const admin = useAdminPost();
  useEffect(() => {
    admin.registerSaveHandler(() => form.handleSubmit(onSubmit)());
  }, [admin, form, onSubmit]);

  // Editor state parsing
  const editorContent = form.watch("content");
  const parsedEditorState = useMemo(() => {
    if (!editorContent) return undefined;
    try {
      return JSON.parse(editorContent);
    } catch {
      return undefined;
    }
  }, [editorContent]);

  const formElement = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <div>
                      <Editor
                        editorSerializedState={parsedEditorState}
                        onSerializedChange={(state) =>
                          field.onChange(JSON.stringify(state))
                        }
                      />
                    </div>
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="auto-generated if empty" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) =>
                    field.onChange(v as PostFormData["status"])
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="authorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author</FormLabel>
                <Select
                  value={field.value ?? "none"}
                  onValueChange={(v) =>
                    field.onChange(
                      v === "none" ? undefined : (v as Id<"users">),
                    )
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select author" />
                    </SelectTrigger>
                  </FormControl>
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma separated)</FormLabel>
                  <FormControl>
                    <Input
                      value={(field.value || []).join(", ")}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Excerpt</FormLabel>
                  <FormControl>
                    <textarea
                      className="min-h-[72px] w-full rounded-md border px-3 py-2 text-sm"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="featuredImageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Featured Image URL</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="readTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Read Time</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 5 min" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Featured</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={(v) => field.onChange(v)}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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

  return isExternal ? formElement : <Form {...form}>{formElement}</Form>;
}
