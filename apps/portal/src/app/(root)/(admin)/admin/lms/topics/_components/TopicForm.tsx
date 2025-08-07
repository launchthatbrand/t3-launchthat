"use client";

import React, { useState } from "react";
import { Doc, Id } from "@convex-config/_generated/dataModel"; // Removed Id import since it's unused

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, PlusCircle, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { MultiSelect } from "@acme/ui/components/multi-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";

import { TagForm, TagFormValues } from "../../../tags/_components/TagForm";

// Schema with extended fields
export const topicFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  excerpt: z.string().optional(),
  categories: z.string().optional(), // comma separated string
  featuredImage: z.string().url().optional(),
  status: z.enum(["draft", "published"]).optional(),
  featured: z.boolean().optional(),
  contentType: z.enum(["text", "video", "quiz"]).optional(),
  content: z.string().optional(),
  menuOrder: z.number().optional(),
  tagIds: z.array(z.string()).optional(), // New field for global tags (Id<"tags"> represented as string)
});

export type TopicFormValues = z.infer<typeof topicFormSchema>;

interface TopicFormProps {
  initialData?: Partial<TopicFormValues> | null;
  onSave: (values: TopicFormValues) => Promise<void>;
  availableTags: Doc<"tags">[];
  createTagMutation: (values: TagFormValues) => Promise<Id<"tags">>; // Corrected return type
}

export const TopicForm: React.FC<TopicFormProps> = ({
  initialData,
  onSave,
  availableTags,
  createTagMutation,
}) => {
  console.log("[Topic : Initial Data]", initialData);
  const [activeTab, setActiveTab] = useState("content");
  const [isNewTagModalOpen, setIsNewTagModalOpen] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      excerpt: initialData?.excerpt ?? "",
      categories: initialData?.categories ?? "",
      featuredImage: initialData?.featuredImage ?? "", // Corrected field name
      status: initialData?.status ?? "draft",
      featured: initialData?.featured ?? false,
      contentType: initialData?.contentType ?? "text",
      content: initialData?.content ?? "",
      menuOrder: initialData?.menuOrder ?? 0,
      tagIds: (initialData?.tagIds as string[]) ?? [], // Explicitly cast to string[]
    },
  });

  const handleSave = async (values: TopicFormValues) => {
    console.log("Attempting to save form with values:", values); // Debug log
    console.log("Form errors:", form.formState.errors); // Debug log
    await onSave(values);
  };

  const handleCreateTag = async (values: TagFormValues) => {
    setIsCreatingTag(true);
    try {
      const newTagId = await createTagMutation(values);
      toast.success("Tag created successfully!");
      setIsNewTagModalOpen(false);

      const currentTagIds = form.getValues("tagIds") ?? []; // Use nullish coalescing
      const updatedTagIds = [...currentTagIds, newTagId];
      form.setValue("tagIds", updatedTagIds as Id<"tags">[], {
        shouldDirty: true,
      }); // Ensure type consistency
    } catch (error: unknown) {
      // Changed type to unknown
      console.error("Failed to create tag:", error);
      toast.error(
        "Failed to create tag: " +
          (error instanceof Error ? error.message : "Unknown error"),
      ); // Safely access message
    } finally {
      setIsCreatingTag(false);
    }
  };

  const tagOptions = availableTags.map((tag) => ({
    label: tag.name,
    value: tag._id,
  }));

  console.log("MultiSelect Tag Options:", tagOptions);
  console.log("MultiSelect Field Value (tagIds):");

  // Dummy categories data for now, replace with actual fetch if needed
  const categories = [
    { value: "uncategorized", label: "Uncategorized" },
    { value: "programming", label: "Programming" },
    { value: "design", label: "Design" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)}>
        <div className="grid gap-6 md:grid-cols-6">
          {/* Main Content */}
          <div className="md:col-span-4">
            <Card>
              <CardHeader className="pb-0">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="mb-2">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="vimeo">Vimeo</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  {/* Content Tab */}
                  <TabsContent value="content" className="pt-4">
                    <div className="grid gap-6">
                      {/* Title */}
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => {
                          console.log("  - Field Value (tagIds):", field.value); // Log inside render
                          return (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Topic title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Description (Content) */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Topic description..."
                                className="min-h-[300px]"
                                {...field}
                              />
                            </FormControl>
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
                            <FormLabel>Content (For Text/Quiz)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Full content for text topics or quiz details..."
                                className="min-h-[300px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  {/* Media Tab */}
                  <TabsContent value="media" className="pt-4">
                    <FormField
                      control={form.control}
                      name="featuredImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Featured Image URL</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-4">
                              <Input
                                placeholder="Enter image URL or upload"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled
                              >
                                <ImagePlus className="h-4 w-4" />
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Image upload integration coming soon
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  {/* Vimeo Tab */}
                  <TabsContent value="vimeo" className="pt-4">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vimeo URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter Vimeo video URL"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Ensure this is a valid Vimeo share URL.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  {/* Settings Tab */}
                  <TabsContent value="settings" className="pt-4">
                    <div className="grid gap-6">
                      {/* Content Type */}
                      <FormField
                        control={form.control}
                        name="contentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
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
                                placeholder="Order in lesson" // Changed from placeholder
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>
          {/* Sidebar */}
          <div className="flex flex-col gap-6 md:col-span-2">
            {/* Publish Card */}
            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
                <CardDescription>Publication settings</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                {/* Status Select */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="topic-status"
                      >
                        Status
                      </label>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger id="topic-status" className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                {/* Featured Switch */}
                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <>
                      <div className="space-y-0.5">
                        <span className="text-base font-medium">Featured</span>
                        <FormDescription>
                          Show this topic as featured
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {form.formState.isSubmitting ? "Saving..." : "Save Topic"}
                </Button>
              </CardFooter>
            </Card>
            {/* Tags Card */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>Assign global tags</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="tagIds"
                  render={({ field }) => {
                    console.log(
                      "  - MultiSelect field.value (tagIds):",
                      field.value,
                    );
                    return (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <MultiSelect
                          options={tagOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          placeholder="Select tags"
                        />
                        <FormDescription>
                          Select relevant global tags for this topic.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <Dialog
                  open={isNewTagModalOpen}
                  onOpenChange={setIsNewTagModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" className="mt-2 w-full">
                      <PlusCircle className="mr-2 h-4 w-4" /> Create New Tag
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Global Tag</DialogTitle>
                      <DialogDescription>
                        Define a new tag that can be used across various content
                        types.
                      </DialogDescription>
                    </DialogHeader>
                    <TagForm
                      onSave={handleCreateTag}
                      isSubmitting={isCreatingTag}
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
            {/* Categories Card - keeping for now */}
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Select category</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="topic-category"
                      >
                        Category
                      </label>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={categories.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger id="topic-category" className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(
                            (c: { value: string; label: string }) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {categories.length === 0 && "No categories available."}
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default TopicForm;
