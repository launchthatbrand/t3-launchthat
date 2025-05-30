"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Skeleton } from "@acme/ui/skeleton";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";

// Available categories - these could come from an API later
const CATEGORIES = [
  "General",
  "Administration",
  "Content",
  "E-commerce",
  "Support",
  "Troubleshooting",
  "Tutorials",
  "Getting Started",
];

// Form schema for validation
const formSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters"),
  category: z.string().min(1, "Please select a category"),
  summary: z
    .string()
    .min(10, "Summary must be at least 10 characters")
    .max(200, "Summary must be less than 200 characters"),
  content: z
    .string()
    .min(50, "Content must be at least 50 characters")
    .max(50000, "Content must be less than 50,000 characters"),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  tags: z
    .array(z.string())
    .default([])
    .or(
      z.string().transform((val) =>
        val
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditHelpdeskArticlePage() {
  const params = useParams();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const slug = params.slug as string;

  // Create form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      category: "",
      summary: "",
      content: "",
      published: false,
      featured: false,
      tags: "",
    },
  });

  // Fetch article data from Convex
  const article = useQuery(api.helpdesk.getHelpdeskArticleBySlug, {
    slug,
  });

  // Get the mutation to update a helpdesk article
  const updateHelpdeskArticle = useMutation(api.helpdesk.updateHelpdeskArticle);

  // Update form when article data is loaded
  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        category: article.category,
        summary: article.summary,
        content: article.content,
        published: article.published,
        featured: article.featured,
        tags: Array.isArray(article.tags) ? article.tags.join(", ") : "",
      });
    }
  }, [article, form]);

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    if (!article) return;

    setIsSubmitting(true);

    try {
      await updateHelpdeskArticle({
        id: article._id,
        title: values.title,
        category: values.category,
        summary: values.summary,
        content: values.content,
        published: values.published,
        featured: values.featured,
        tags: values.tags,
      });

      toast.success("Article updated", {
        description: "Your helpdesk article has been updated successfully.",
      });

      // Redirect to the article page (using the possibly new slug)
      const newSlug = values.title
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, "-");
      router.push(`/admin/helpdesk/article/${newSlug}`);
    } catch (error) {
      console.error("Error updating article:", error);
      toast.error("Error", {
        description: "Failed to update helpdesk article. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (article === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-32" />
            <Skeleton className="mt-2 h-8 w-60" />
            <Skeleton className="mt-2 h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-8">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-80 w-full" />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Article not found
  if (article === null) {
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center">
        <h2 className="text-2xl font-semibold">Article Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The article you're trying to edit doesn't exist or has been moved.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/helpdesk">Back to Helpdesk</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/helpdesk/article/${slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Article
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Helpdesk Article</h1>
          <p className="text-muted-foreground">
            Update your help article content and settings
          </p>
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          onClick={form.handleSubmit(onSubmit)}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Changing the title will also update the article's URL.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
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
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="authentication, permissions, roles"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated list of tags
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Textarea className="resize-none" rows={2} {...field} />
                    </FormControl>
                    <FormDescription>
                      A brief summary that will appear in search results
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        className="h-80 resize-none font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This content supports HTML formatting for rich content.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Published</FormLabel>
                        <FormDescription>
                          Make this article visible to users.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Featured</FormLabel>
                        <FormDescription>
                          Highlight this article on the helpdesk homepage.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
