"use client";

import type { UseFormReturn } from "react-hook-form";
import React, { useState } from "react";
import MediaPicker from "@/components/MediaPicker";
import { Save } from "lucide-react";
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

export const lessonFormSchema = z.object({
  _id: z.string().optional(),
  slug: z.string().min(1, { message: "Slug is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  categories: z.string().optional(), // comma separated
  featuredMedia: z.string().url().optional(),
  status: z.enum(["draft", "published"]).optional(),
  featured: z.boolean().optional(),
});

export type LessonFormValues = z.infer<typeof lessonFormSchema>;

interface LessonFormProps {
  initialData?: Partial<LessonFormValues> | null;
  onSubmit: (data: LessonFormValues) => Promise<void>;
  isSubmitting: boolean;
  categories: { value: string; label: string }[];
  submitButtonText?: string;
  formInstance?: UseFormReturn<LessonFormValues>;
}

export const LessonForm: React.FC<LessonFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  categories,
  submitButtonText = "Save Lesson",
}) => {
  console.log("initialData", initialData);
  const [activeTab, setActiveTab] = useState("content");
  const [currentStatus, setCurrentStatus] = useState<"draft" | "published">(
    initialData?.status ?? "draft",
  );
  const [currentFeatured, setCurrentFeatured] = useState<boolean>(
    initialData?.featured ?? false,
  );

  const form = useForm<LessonFormValues>({
    defaultValues: {
      _id: initialData?._id ?? "",
      title: initialData?.title ?? "",
      content: initialData?.content ?? "",
      excerpt: initialData?.excerpt ?? "",
      categories: initialData?.categories ?? "",
      featuredMedia: initialData?.featuredMedia ?? "",
      status: initialData?.status ?? "draft",
      featured: initialData?.featured ?? false,
    },
  });

  const handleSubmit = async (values: LessonFormValues) => {
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
          {/* Main content */}
          <div className="md:col-span-4">
            <Card>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <CardHeader className="pb-0">
                  <TabsList className="mb-2 flex justify-start">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
                  <TabsContent value="content" className="pt-4">
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Lesson ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Lesson title" {...field} />
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
                                placeholder="Brief summary of the lesson"
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
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
                                placeholder="Lesson content..."
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
                  <TabsContent value="media" className="pt-4">
                    <FormField
                      control={form.control}
                      name="featuredMedia"
                      render={() => (
                        <FormItem>
                          <FormLabel>Featured Media</FormLabel>
                          <MediaPicker
                            control={form.control}
                            postId={initialData?._id}
                            postType="lesson"
                            name="featuredMedia"
                            placeholder="Choose featured image"
                            _value={initialData?.featuredMedia}
                          />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
          {/* Sidebar */}
          <div className="flex flex-col gap-6 md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
                <CardDescription>Publication settings</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field: { onChange, ...rest } }) => (
                    <FormItem className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="lesson-status"
                      >
                        Status
                      </label>
                      <Select
                        onValueChange={(v) => {
                          setCurrentStatus(v as "draft" | "published");
                          onChange(v);
                        }}
                        {...rest}
                      >
                        <FormControl>
                          <SelectTrigger id="lesson-status" className="w-full">
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
                          Show this lesson as featured
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
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Select category</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field: { onChange, ...rest } }) => (
                    <FormItem className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="lesson-category"
                      >
                        Category
                      </label>
                      <Select
                        onValueChange={(v) => {
                          onChange(v);
                        }}
                        disabled={categories.length === 0}
                        {...rest}
                      >
                        <FormControl>
                          <SelectTrigger
                            id="lesson-category"
                            className="w-full"
                          >
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

export default LessonForm;
