"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import React, { useState } from "react";
import { api } from "@convex-config/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

// Topic creation schema (copied from builder/page.tsx)
const createTopicSchema = z.object({
  title: z.string().min(1, { message: "Topic title is required" }),
  contentType: z.union(
    [z.literal("text"), z.literal("video"), z.literal("quiz")],
    { message: "Content type is required" },
  ),
  content: z.string().optional(),
});

type CreateTopicFormValues = z.infer<typeof createTopicSchema>;

interface CreateTopicDialogProps {
  lessonId?: Id<"lessons">; // Optional, as topics can be standalone
  onCreate: (topicId: Id<"topics">) => Promise<void>;
}

export const CreateTopicDialog: React.FC<CreateTopicDialogProps> = ({
  lessonId,
  onCreate,
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateTopicFormValues>({
    resolver: zodResolver(createTopicSchema),
    defaultValues: { title: "", contentType: "text", content: "" },
  });

  const createTopic = useMutation(api.lms.topics.mutations.create);
  const attachTopicToLesson = useMutation(
    api.lms.topics.mutations.attachToLesson,
  );

  const handleSubmit = async (values: CreateTopicFormValues) => {
    setIsSubmitting(true);
    try {
      const newTopicId = await createTopic(values);
      if (lessonId) {
        await attachTopicToLesson({
          lessonId,
          topicId: newTopicId,
          order: 0, // Default to 0, actual order will be handled by reordering
        });
      }
      await onCreate(newTopicId);
      toast.success("Topic created!");
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create topic:", error);
      toast.error("Failed to create topic.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full md:w-auto">
          New Topic
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Create New Topic</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="text">Text</option>
                      <option value="video">Video</option>
                      <option value="quiz">Quiz</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("contentType") === "text" && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Topic"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTopicDialog;
