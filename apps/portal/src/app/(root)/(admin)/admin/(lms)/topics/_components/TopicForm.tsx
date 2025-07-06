"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Save } from "lucide-react";
import { useForm } from "react-hook-form";
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

// Schema with extended fields
export const topicFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  excerpt: z.string().optional(),
  categories: z.string().optional(), // comma separated string
  featuredImageUrl: z.string().url().optional(),
  status: z.enum(["draft", "published"]).optional(),
  featured: z.boolean().optional(),
});

export type TopicFormValues = z.infer<typeof topicFormSchema>;

interface TopicFormProps {
  initialData?: Partial<TopicFormValues> | null;
  onSubmit: (values: TopicFormValues) => Promise<void>;
  isSubmitting: boolean;
  categories?: { value: string; label: string }[];
  submitButtonText?: string;
}

export const TopicForm: React.FC<TopicFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  categories = [],
  submitButtonText = "Save Topic",
}) => {
  const [activeTab, setActiveTab] = useState("content");
  const [currentStatus, setCurrentStatus] = useState<"draft" | "published">(
    initialData?.status ?? "draft",
  );
  const [currentFeatured, setCurrentFeatured] = useState<boolean>(
    initialData?.featured ?? false,
  );
  const [currentCategory, setCurrentCategory] = useState<string>(
    initialData?.categories?.split(",")[0]?.trim() ?? "",
  );

  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      excerpt: initialData?.excerpt ?? "",
      categories: initialData?.categories ?? "",
      featuredImageUrl: initialData?.featuredImageUrl ?? "",
      status: initialData?.status ?? "draft",
      featured: initialData?.featured ?? false,
    },
  });

  const handleSubmit = async (values: TopicFormValues) => {
    await onSubmit({
      ...values,
      status: currentStatus,
      featured: currentFeatured,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
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
                  </TabsList>
                  {/* Content Tab */}
                  <TabsContent value="content" className="pt-4">
                    <div className="grid gap-6">
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Content */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Topic content..."
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
                      name="featuredImageUrl"
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
                  render={({ field: { onChange, value: _value, ...rest } }) => (
                    <FormItem className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="topic-status"
                      >
                        Status
                      </label>
                      <Select
                        onValueChange={(v) => {
                          setCurrentStatus(v as "draft" | "published");
                          onChange(v);
                        }}
                        value={_value}
                        {...rest}
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
                  render={({
                    field: { value: _v, onChange, ...restField },
                  }) => (
                    <>
                      <div className="space-y-0.5">
                        <span className="text-base font-medium">Featured</span>
                        <FormDescription>
                          Show this topic as featured
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
                    </>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Saving..." : submitButtonText}
                </Button>
              </CardFooter>
            </Card>
            {/* Categories Card */}
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Select category</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field: { onChange, value: _val, ...rest } }) => (
                    <FormItem className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="topic-category"
                      >
                        Category
                      </label>
                      <Select
                        value={currentCategory || _val}
                        onValueChange={(v) => {
                          setCurrentCategory(v);
                          onChange(v);
                        }}
                        disabled={categories.length === 0}
                        {...rest}
                      >
                        <FormControl>
                          <SelectTrigger id="topic-category" className="w-full">
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
