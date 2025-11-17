"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { MultiSelect } from "@acme/ui/components/multi-select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";

const mediaSchema = z.object({
  title: z.string().optional(),
  caption: z.string().optional(),
  alt: z.string().optional(),
  categories: z.array(z.string()).optional(),
  status: z.union([z.literal("draft"), z.literal("published")]),
});

export type MediaFormValues = z.infer<typeof mediaSchema>;

interface MediaFormProps {
  initialData: MediaFormValues | null;
  onSubmit: (values: MediaFormValues) => Promise<void>;
  isSubmitting: boolean;
  categories: { value: string; label: string }[];
}

export const MediaForm: React.FC<MediaFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  categories,
}) => {
  const form = useForm<MediaFormValues>({
    resolver: zodResolver(mediaSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      caption: initialData?.caption ?? "",
      alt: initialData?.alt ?? "",
      categories: initialData?.categories ?? [],
      status: initialData?.status ?? "draft",
    },
  });

  const handleSubmit = async (values: MediaFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="grid gap-6 md:grid-cols-6"
      >
        {/* Main */}
        <div className="space-y-6 md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Media Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="caption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caption</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Enter caption"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alt Text</FormLabel>
                    <FormControl>
                      <Input placeholder="Alt text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 md:col-span-2">
          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <MultiSelect
                      options={categories}
                      defaultValue={field.value ?? []}
                      onValueChange={field.onChange}
                      placeholder="Select categories"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Publish</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value === "published"}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? "published" : "draft")
                          }
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </Form>
  );
};
