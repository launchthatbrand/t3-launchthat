"use client";

import type { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Form } from "@acme/ui/form"; // Import Form component

import { toast } from "@acme/ui/toast";

interface NewItemDialogProps {
  title: string;
  description: string;
  onSubmit: (values: z.infer<z.AnyZodObject>) => Promise<void>;
  trigger: React.ReactNode; // Explicitly define trigger prop for the button
  children: React.ReactNode; // Children will be the form fields
  formInstance: UseFormReturn<z.AnyZodObject>;
}

export const NewItemDialog: React.FC<NewItemDialogProps> = ({
  title,
  description,
  onSubmit,
  trigger,
  children,
  formInstance,
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = formInstance;

  const handleSubmit = async (values: z.infer<z.AnyZodObject>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      toast.success(`${title} created!`);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error(`Failed to create ${title}:`, error);
      toast.error(`Failed to create ${title}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`Create New ${title}`}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          {" "}
          {/* Wrap with Form component and pass formInstance */}
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-4 py-4"
          >
            {children}
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : `Create ${title}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewItemDialog;
