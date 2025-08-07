import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";

const optionSchema = z.object({
  value: z.string().min(1, { message: "Option required" }),
});

const questionSchema = z.object({
  questionText: z.string().min(1, { message: "Question is required" }),
  options: z.array(optionSchema).min(2, { message: "At least two options" }),
  correctIndex: z.number().min(0),
});

export const quizFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  questions: z.array(questionSchema).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export type QuizFormValues = z.infer<typeof quizFormSchema>;

interface QuizFormProps {
  initialData?: Partial<QuizFormValues> | null;
  onSubmit: (values: QuizFormValues) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

const QuizForm: React.FC<QuizFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  submitButtonText = "Save Quiz",
}) => {
  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      questions: initialData?.questions ?? [],
      status: initialData?.status ?? "draft",
    },
  });

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({ control: form.control, name: "questions" });

  const handleSubmit = async (values: QuizFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid gap-6 md:grid-cols-6">
          {/* Main Content */}
          <div className="space-y-6 md:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Details</CardTitle>
                <CardDescription>Update quiz information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Quiz title" {...field} />
                      </FormControl>
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
                          placeholder="Describe the quiz..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Questions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Questions</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendQuestion({
                          questionText: "",
                          options: [{ value: "" }, { value: "" }],
                          correctIndex: 0,
                        })
                      }
                    >
                      <Plus className="mr-1 h-4 w-4" /> Add Question
                    </Button>
                  </div>

                  {questionFields.map((field, qIndex) => {
                    const opts =
                      form.watch(`questions.${qIndex}.options` as const) ?? [];

                    return (
                      <Card key={field.id} className="space-y-4 p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">
                            Question #{qIndex + 1}
                          </h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuestion(qIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Question Text */}
                        <FormField
                          control={form.control}
                          name={`questions.${qIndex}.questionText` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter question"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Options */}
                        <div className="space-y-2">
                          {opts.map((_, oIndex) => (
                            <div
                              key={`${qIndex}-${oIndex}`}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="radio"
                                className="h-4 w-4"
                                checked={
                                  form.watch(
                                    `questions.${qIndex}.correctIndex`,
                                  ) === oIndex
                                }
                                onChange={() =>
                                  form.setValue(
                                    `questions.${qIndex}.correctIndex`,
                                    oIndex,
                                  )
                                }
                              />
                              <FormField
                                control={form.control}
                                name={
                                  `questions.${qIndex}.options.${oIndex}.value` as const
                                }
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input
                                        placeholder={`Option ${oIndex + 1}`}
                                        {...field}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const current = form.getValues(
                                    `questions.${qIndex}.options`,
                                  ) as { value: string }[];
                                  current.splice(oIndex, 1);
                                  form.setValue(
                                    `questions.${qIndex}.options`,
                                    current,
                                  );
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const current = form.getValues(
                                `questions.${qIndex}.options`,
                              ) as { value: string }[] | undefined;
                              form.setValue(`questions.${qIndex}.options`, [
                                ...(current ?? []),
                                { value: "" },
                              ]);
                            }}
                          >
                            <Plus className="mr-1 h-4 w-4" /> Add Option
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span>Status</span>
                <Switch
                  checked={form.watch("status") === "published"}
                  onCheckedChange={(checked) =>
                    form.setValue("status", checked ? "published" : "draft")
                  }
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" /> {submitButtonText}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default QuizForm;
