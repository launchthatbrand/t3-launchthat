/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type { Post, PostFormData, PostStatus } from "@/lib/blog";
import type { UseFormReturn } from "react-hook-form";
import React, { useEffect, useState } from "react";
import { generateSlugFromTitle, parseTags } from "@/lib/blog";
import { ImagePlus, Save } from "lucide-react";
import { useForm } from "react-hook-form";

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

// import { toast } from "@acme/ui/toast"; // Will be handled by parent pages

export interface PostFormValues {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  selectedTags: string[]; // Changed from string to string[]
  featuredImageUrl?: string;
  readTime: string;
  // Dummy fields for form context
  _status?: string;
  _category?: string;
  _featured?: boolean;
}

interface PostFormProps {
  initialData?: Post | null;
  onSubmit: (data: PostFormData) => Promise<void>;
  isSubmitting: boolean;
  categories: { value: string; label: string }[];
  submitButtonText?: string;
  formInstance?: UseFormReturn<PostFormValues>;
}

const PostFormComponent: React.FC<PostFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  categories,
  submitButtonText = "Save Post",
}) => {
  const [activeTab, setActiveTab] = useState("content");
  const [currentStatus, setCurrentStatus] = useState<PostStatus>("draft");
  const [currentCategory, setCurrentCategory] = useState<string>("");
  const [currentFeatured, setCurrentFeatured] = useState<boolean>(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [availableTags, setAvailableTags] = useState<
    { value: string; label: string }[]
  >([]);

  const form = useForm<PostFormValues>({
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      selectedTags: [],
      featuredImageUrl: "",
      readTime: "",
      _status: "draft",
      _category: "",
      _featured: false,
    },
  });

  useEffect(() => {
    if (initialData && !initialDataLoaded) {
      form.setValue("title", initialData.title);
      form.setValue("slug", initialData.slug);
      form.setValue("excerpt", initialData.excerpt ?? "");
      form.setValue("content", initialData.content);
      form.setValue("selectedTags", initialData.tags ?? []);
      form.setValue("featuredImageUrl", initialData.featuredImageUrl ?? "");
      form.setValue("readTime", initialData.readTime ?? "");
      form.setValue("_status", initialData.status);
      form.setValue("_category", initialData.category ?? "");
      form.setValue("_featured", initialData.featured ?? false);

      setCurrentStatus(initialData.status);
      setCurrentCategory(initialData.category ?? "");
      setCurrentFeatured(initialData.featured ?? false);

      // Create options from existing tags
      if (initialData.tags && initialData.tags.length > 0) {
        setAvailableTags(
          initialData.tags.map((tag) => ({ value: tag, label: tag })),
        );
      }

      setInitialDataLoaded(true);
    } else if (!initialData && !initialDataLoaded) {
      // If it's a new post form, make sure category is set if categories exist
      if (categories.length > 0 && !currentCategory) {
        setCurrentCategory(categories[0]?.value ?? "");
      }
      setInitialDataLoaded(true);
    }
  }, [initialData, form, categories, initialDataLoaded, currentCategory]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const titleValue = e.target.value;
    form.setValue("title", titleValue);
    if (!form.getValues("slug") || (initialData && !initialData.slug)) {
      form.setValue("slug", generateSlugFromTitle(titleValue));
    }
  };

  const handleSubmit = async (values: PostFormValues) => {
    const postData: PostFormData = {
      title: values.title,
      content: values.content,
      excerpt: values.excerpt || undefined,
      slug: values.slug || generateSlugFromTitle(values.title),
      status: currentStatus,
      category: currentCategory,
      tags: values.selectedTags,
      featured: currentFeatured,
      featuredImageUrl: values.featuredImageUrl ?? undefined,
      readTime: values.readTime ?? undefined,
    };
    await onSubmit(postData);
  };

  const statusOptions = [
    { value: "draft" as PostStatus, label: "Draft" },
    { value: "published" as PostStatus, label: "Published" },
    { value: "archived" as PostStatus, label: "Archived" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid gap-6 md:grid-cols-6">
          {/* Main content area */}
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
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="pt-4">
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter post title"
                                {...field}
                                onChange={handleTitleChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="excerpt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Excerpt</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Brief summary of the post"
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              A short summary that appears in post lists and
                              search results
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
                                placeholder="Write your post content here..."
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

                  <TabsContent value="seo" className="pt-4">
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <FormControl>
                              <Input placeholder="post-url-slug" {...field} />
                            </FormControl>
                            <FormDescription>
                              The URL-friendly version of the title
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* SEO Preview Placeholder */}
                      <div className="grid gap-4">
                        <h3 className="text-sm font-medium">SEO Preview</h3>
                        <div className="rounded-md border p-4">
                          <div className="text-blue-600 hover:underline">
                            {form.watch("title") || "Post Title"}
                          </div>
                          <div className="text-sm text-green-700">
                            https://example.com/blog/
                            {form.watch("slug") || "post-title"}
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            {form.watch("excerpt") ||
                              "This is where your post excerpt will appear in search results..."}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="pt-4">
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="featuredImageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Featured Image URL</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-4">
                                <Input
                                  placeholder="Enter image URL or path"
                                  {...field}
                                  value={field.value || ""}
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
                              URL or path to the main image for the post. Actual
                              upload UI coming soon.
                            </FormDescription>
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

          {/* Sidebar area */}
          <div className="flex flex-col gap-6 md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
                <CardDescription>
                  Configure publication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <FormField
                  control={form.control}
                  name="_status"
                  render={({ field: { onChange, ...rest } }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          setCurrentStatus(value as PostStatus);
                          onChange(value);
                        }}
                        {...rest}
                      >
                        <FormControl>
                          <SelectTrigger id="post-status" className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="_featured"
                  render={({ field: { value, onChange, ...restField } }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Featured</FormLabel>
                        <FormDescription>
                          Show this post in featured sections
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={currentFeatured}
                          onCheckedChange={(checked) => {
                            setCurrentFeatured(checked);
                            onChange(checked);
                          }}
                          {...restField}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Saving..." : submitButtonText}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
                <CardDescription>Additional post details</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <FormField
                  control={form.control}
                  name="_category"
                  render={({ field: { onChange, ...rest } }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          setCurrentCategory(value);
                          onChange(value);
                        }}
                        disabled={categories.length === 0}
                        {...rest}
                      >
                        <FormControl>
                          <SelectTrigger id="post-category" className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                            >
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {categories.length === 0 && "No categories available."}
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="selectedTags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <MultiSelect
                          placeholder="Select or enter tags"
                          options={availableTags.map((tag) => ({
                            label: tag.label,
                            value: tag.value,
                          }))}
                          onValueChange={(values) => {
                            field.onChange(values);

                            // Update available tags with any new ones
                            const newTags = values
                              .filter(
                                (tag) =>
                                  !availableTags.some(
                                    (existing) => existing.value === tag,
                                  ),
                              )
                              .map((tag) => ({ label: tag, value: tag }));

                            if (newTags.length > 0) {
                              setAvailableTags((prev) => [...prev, ...newTags]);
                            }
                          }}
                          defaultValue={field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Select existing tags or type to create new ones
                      </FormDescription>
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
                        <Input placeholder="5 min" {...field} />
                      </FormControl>
                      <FormDescription>Estimated reading time</FormDescription>
                      <FormMessage />
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

export default PostFormComponent;
