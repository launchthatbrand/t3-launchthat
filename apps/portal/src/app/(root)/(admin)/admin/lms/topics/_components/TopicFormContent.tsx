"use client";

import { Doc, Id } from "@convex-config/_generated/dataModel";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import type { AdminPostFormProps } from "~/components/admin/AdminSinglePostLayout";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import React from "react";
import { Textarea } from "@acme/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Schema for topic form
export const topicFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  excerpt: z.string().optional(),
  categories: z.string().optional(),
  content: z.string().optional(),
  contentType: z.enum(["text", "video", "quiz"]).optional(),
  menuOrder: z.number().optional(),
  tagIds: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  featuredImage: z.string().optional(),
  featuredMedia: z.any().optional(),
});

export type TopicFormValues = z.infer<typeof topicFormSchema>;

// Extended props for TopicFormContent
export interface TopicFormContentProps extends AdminPostFormProps {
  availableTags?: Doc<"tags">[];
  categories?: { value: string; label: string }[];
}

export const TopicFormContent: React.FC<TopicFormContentProps> = ({
  onSave,
  isSubmitting,
  formData: initialData,
  availableTags = [],
  categories = [],
}) => {
  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      title: (initialData as any)?.title ?? "",
      description: (initialData as any)?.description ?? "",
      excerpt: (initialData as any)?.excerpt ?? "",
      categories: (initialData as any)?.categories ?? "",
      content: (initialData as any)?.content ?? "",
      contentType: (initialData as any)?.contentType ?? "text",
      menuOrder: (initialData as any)?.menuOrder ?? 0,
      tagIds: (initialData as any)?.tagIds ?? [],
      isPublished: (initialData as any)?.isPublished ?? false,
      featuredImage: (initialData as any)?.featuredImage ?? "",
      featuredMedia: (initialData as any)?.featuredMedia,
    },
  });

  const handleSubmit = async (data: TopicFormValues) => {
    if (onSave) {
      await onSave(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Topic title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Excerpt */}
        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excerpt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief summary of the topic"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A short summary that appears in topic listings
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Topic description..."
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Detailed description of the topic
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Content */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Full content for text topics or quiz details..."
                  className="min-h-[300px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The main content for text topics or detailed quiz information
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Content Type */}
        <FormField
          control={form.control}
          name="contentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a content type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the type of content for this topic
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Menu Order */}
        <FormField
          control={form.control}
          name="menuOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Menu Order</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Order in lesson"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Determines the order this topic appears in lessons
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categories */}
        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={categories.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {categories.length === 0
                  ? "No categories available."
                  : "Choose a category for this topic"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hidden submit button - the layout will handle saving */}
        <Button type="submit" className="hidden">
          Save
        </Button>
      </form>
    </Form>
  );
};

export default TopicFormContent;
