"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
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
  tags: z.string().transform((val) =>
    val
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  ),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewHelpdeskArticlePage() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Get the mutation to create a helpdesk article
  const createHelpdeskArticle = useMutation(api.helpdesk.createHelpdeskArticle);

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      const articleId = await createHelpdeskArticle({
        title: values.title,
        category: values.category,
        summary: values.summary,
        content: values.content,
        published: values.published,
        featured: values.featured,
        tags: values.tags,
      });

      toast({
        title: "Article created",
        description: "Your helpdesk article has been created successfully.",
      });

      // Redirect to the article page
      router.push(
        `/admin/helpdesk/article/${form
          .getValues()
          .title.toLowerCase()
          .replace(/[^\w\s]/g, "")
          .replace(/\s+/g, "-")}`,
      );
    } catch (error) {
      console.error("Error creating article:", error);
      toast({
        title: "Error",
        description: "Failed to create helpdesk article. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/helpdesk">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Helpdesk
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Create New Helpdesk Article</h1>
          <p className="text-muted-foreground">
            Create a new help article for your users
          </p>
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          onClick={form.handleSubmit(onSubmit)}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Saving..." : "Save Article"}
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
                      <Input
                        placeholder="e.g., How to Configure User Permissions"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Create a clear, descriptive title that helps users find
                      this article.
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
                      <FormDescription>
                        Choose the most relevant category for this article.
                      </FormDescription>
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
                        Comma-separated list of tags to help with search and
                        filtering.
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
                      <Textarea
                        placeholder="A brief summary of what this article covers..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Write a short summary that will appear in search results
                      and previews.
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
                        placeholder="Write your article content here. You can use HTML formatting for headers, lists, and other elements."
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
                          Make this article immediately visible to users.
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
