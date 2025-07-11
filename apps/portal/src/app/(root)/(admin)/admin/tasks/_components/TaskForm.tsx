"use client";

import * as React from "react";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { Button } from "@acme/ui/button";
import { Calendar } from "@acme/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Input } from "@acme/ui/input";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { useAction } from "@/hooks/useAction";
import { useForm } from "react-hook-form";
import { useMutation } from "convex/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Local cn utility (Tailwind merge helper)
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const TaskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
  status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
});

export type TaskFormValues = z.infer<typeof TaskFormSchema>;

type TaskFormProps = {
  boardId?: Id<"taskBoards">;
  task?: Doc<"tasks">;
  onSuccess?: () => void;
};

export const TaskForm: React.FC<TaskFormProps> = ({
  boardId,
  task,
  onSuccess,
}) => {
  const [error, setError] = React.useState<string | null>(null);
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
      isRecurring: task?.isRecurring ?? false,
      recurrenceRule: task?.recurrenceRule ?? "",
      status: task?.status ?? "pending",
    },
  });

  const createTask = useMutation(api.tasks.index.createTask);
  const updateTask = useMutation(api.tasks.index.updateTask);

  const onSubmit = async (values: TaskFormValues) => {
    setError(null);
    try {
      if (task) {
        await updateTask({
          taskId: task._id,
          ...values,
        });
      } else {
        await createTask({
          ...values,
          ...(boardId ? { boardId } : {}),
        });
      }
      form.reset();
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        autoComplete="off"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Task title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Task description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Due Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>Set a due date for this task.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isRecurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Recurring</FormLabel>
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
          name="recurrenceRule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recurrence Rule</FormLabel>
              <FormControl>
                <Input placeholder="e.g. daily, weekly, RRULE..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          {form.formState.isSubmitting ? "Saving..." : "Save Task"}
        </Button>
      </form>
    </Form>
  );
};
