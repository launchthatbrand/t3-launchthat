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
import { toast } from "@acme/ui/toast";

// Quiz creation schema (copied from builder/page.tsx)
const createQuizSchema = z.object({
  title: z.string().min(1, { message: "Quiz title is required" }),
});

type CreateQuizFormValues = z.infer<typeof createQuizSchema>;

interface CreateQuizDialogProps {
  lessonId?: Id<"lessons">; // Optional, as quizzes can be standalone
  onCreate: (quizId: Id<"quizzes">) => Promise<void>;
}

export const CreateQuizDialog: React.FC<CreateQuizDialogProps> = ({
  lessonId,
  onCreate,
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateQuizFormValues>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: { title: "" },
  });

  const createQuiz = useMutation(api.lms.quizzes.index.create);
  const attachQuizToLesson = useMutation(api.lms.quizzes.index.attach);

  const handleSubmit = async (values: CreateQuizFormValues) => {
    setIsSubmitting(true);
    try {
      const newQuizId = await createQuiz({
        title: values.title,
        questions: [],
      }); // Pass empty array for questions
      if (lessonId) {
        await attachQuizToLesson({
          lessonId,
          quizId: newQuizId,
          order: 0, // Default to 0, actual order will be handled by reordering
          isFinal: false, // Default value
        });
      }
      await onCreate(newQuizId);
      toast.success("Quiz created!");
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create quiz:", error);
      toast.error("Failed to create quiz.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full md:w-auto">
          New Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Create New Quiz</DialogTitle>
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
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Quiz"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuizDialog;
