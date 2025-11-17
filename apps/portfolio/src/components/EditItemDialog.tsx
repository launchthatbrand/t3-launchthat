"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";

const editSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
});

export interface EditItemDialogProps {
  dialogTitle: string;
  dialogDescription?: string;
  initialTitle: string;
  onSubmit: (values: z.infer<typeof editSchema>) => Promise<void>;
  triggerButtonText?: string;
  triggerButtonClassName?: string;
  triggerButtonVariant?:
    | "default"
    | "outline"
    | "ghost"
    | "link"
    | "destructive";
}

export const EditItemDialog: React.FC<EditItemDialogProps> = ({
  dialogTitle,
  dialogDescription,
  initialTitle,
  onSubmit,
  triggerButtonText = "Edit",
  triggerButtonClassName,
  triggerButtonVariant = "outline",
}) => {
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: { title: initialTitle },
  });

  const handleSubmit = async (values: z.infer<typeof editSchema>) => {
    await onSubmit(values);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerButtonVariant}
          size="sm"
          className={triggerButtonClassName}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {triggerButtonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          {dialogDescription && (
            <DialogDescription>{dialogDescription}</DialogDescription>
          )}
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
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
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
