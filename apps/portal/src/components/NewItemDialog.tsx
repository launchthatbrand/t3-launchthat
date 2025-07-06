"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { Button, ButtonProps } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Form } from "@acme/ui/form";

import { cn } from "~/lib/utils";

interface NewItemDialogProps<T extends z.ZodTypeAny> {
  title: string;
  description: string;
  form: UseFormReturn<z.infer<T>>;
  onSubmit: (values: z.infer<T>) => Promise<void>;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerButtonText: string;
  triggerButtonClassName?: string;
  triggerButtonVariant?: ButtonProps["variant"];
  className?: string;
}

export const NewItemDialog = <T extends z.ZodTypeAny>({
  title,
  description,
  form,
  onSubmit,
  children,
  open,
  onOpenChange,
  triggerButtonText,
  triggerButtonClassName,
  triggerButtonVariant = "primary",
  className,
}: NewItemDialogProps<T>) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          className={cn("w-full", triggerButtonClassName)}
          variant={triggerButtonVariant}
        >
          {triggerButtonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {children}
            <Button type="submit" className="w-full">
              Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
