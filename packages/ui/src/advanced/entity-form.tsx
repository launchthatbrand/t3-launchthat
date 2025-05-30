"use client";

import * as React from "react";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../form";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

import { Button } from "../button";
import { Calendar } from "../calendar";
import { CalendarIcon } from "lucide-react";
import { Checkbox } from "../checkbox";
import { Input } from "../input";
import { Textarea } from "../textarea";
import { cn } from "@acme/ui";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Base form props
export interface EntityFormProps {
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  defaultValues?: any;
  isLoading?: boolean;
  isSubmitting?: boolean;
  validationSchema?: z.ZodType<any, any>;
  children?: React.ReactNode;
  submitButtonText?: string;
  className?: string;
}

// Generic entity form component
export function EntityForm({
  onSubmit,
  onCancel,
  defaultValues = {},
  isLoading = false,
  isSubmitting = false,
  validationSchema,
  children,
  submitButtonText = "Submit",
  className,
}: EntityFormProps) {
  // Create form with optional validation schema
  const form = useForm({
    resolver: validationSchema ? zodResolver(validationSchema) : undefined,
    defaultValues,
  });

  // Handle form submission
  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
        <div className="space-y-4">{children}</div>
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Submitting..." : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Text input field component
export function FormTextInput({
  name,
  label,
  placeholder,
  description,
  required = false,
  disabled = false,
  className,
}: {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              {...field}
              disabled={disabled}
              value={field.value || ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Textarea input field component
export function FormTextareaInput({
  name,
  label,
  placeholder,
  description,
  required = false,
  disabled = false,
  className,
  rows = 3,
}: {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  rows?: number;
}) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              rows={rows}
              {...field}
              disabled={disabled}
              value={field.value || ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Checkbox input field component
export function FormCheckbox({
  name,
  label,
  description,
  disabled = false,
  className,
}: {
  name: string;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex flex-row items-start space-x-3 space-y-0",
            className,
          )}
        >
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="text-sm font-medium">{label}</FormLabel>
            {description && (
              <FormDescription className="text-xs">
                {description}
              </FormDescription>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Select dropdown field component
export function FormSelect({
  name,
  label,
  placeholder = "Select an option",
  description,
  options,
  required = false,
  disabled = false,
  className,
}: {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Date picker field component
export function FormDatePicker({
  name,
  label,
  placeholder = "Select a date",
  description,
  required = false,
  disabled = false,
  className,
}: {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full text-left font-normal",
                    !field.value && "text-muted-foreground",
                  )}
                  disabled={disabled}
                >
                  {field.value ? (
                    format(new Date(field.value), "PPP")
                  ) : (
                    <span>{placeholder}</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={field.onChange}
                disabled={disabled}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Form section component for grouping related fields
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4 rounded-lg border p-4", className)}>
      {title && <h3 className="text-lg font-medium">{title}</h3>}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// Group Entity Form Schema
export const groupFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  privacy: z.enum(["public", "private", "restricted"]),
  avatar: z.string().optional(),
  coverImage: z.string().optional(),
  settings: z.object({
    allowMemberPosts: z.boolean().default(true),
    allowMemberInvites: z.boolean().default(false),
    showInDirectory: z.boolean().default(true),
  }),
  categoryTags: z.array(z.string()).optional(),
});

export type GroupFormValues = z.infer<typeof groupFormSchema>;

// Group form component
export function GroupForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading = false,
  isSubmitting = false,
  className,
}: Omit<
  EntityFormProps,
  "validationSchema" | "children" | "submitButtonText"
> & {
  defaultValues?: Partial<GroupFormValues>;
}) {
  return (
    <EntityForm
      onSubmit={onSubmit}
      onCancel={onCancel}
      defaultValues={{
        name: "",
        description: "",
        privacy: "public",
        settings: {
          allowMemberPosts: true,
          allowMemberInvites: false,
          showInDirectory: true,
        },
        ...defaultValues,
      }}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      validationSchema={groupFormSchema}
      submitButtonText={defaultValues?.name ? "Save Changes" : "Create Group"}
      className={className}
    >
      <FormTextInput
        name="name"
        label="Group Name"
        placeholder="Enter group name"
        required
      />
      <FormTextareaInput
        name="description"
        label="Description"
        placeholder="Describe what this group is about"
      />
      <FormSelect
        name="privacy"
        label="Privacy Setting"
        options={[
          { value: "public", label: "Public - Anyone can see and join" },
          {
            value: "private",
            label: "Private - Only visible and joinable via invitation",
          },
          {
            value: "restricted",
            label: "Restricted - Visible to all, but requires approval to join",
          },
        ]}
        required
      />
      <FormSection title="Group Settings">
        <FormCheckbox
          name="settings.allowMemberPosts"
          label="Allow members to create posts"
          description="When disabled, only admins and moderators can post"
        />
        <FormCheckbox
          name="settings.allowMemberInvites"
          label="Allow members to invite others"
          description="When disabled, only admins and moderators can invite new members"
        />
        <FormCheckbox
          name="settings.showInDirectory"
          label="Show in group directory"
          description="When disabled, the group won't appear in public group listings"
        />
      </FormSection>
    </EntityForm>
  );
}

// Event form schema
export const eventFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  location: z.string().optional(),
  isPrivate: z.boolean().default(false),
});

export type EventFormValues = z.infer<typeof eventFormSchema>;

// Event form component
export function EventForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading = false,
  isSubmitting = false,
  className,
}: Omit<
  EntityFormProps,
  "validationSchema" | "children" | "submitButtonText"
> & {
  defaultValues?: Partial<EventFormValues>;
}) {
  return (
    <EntityForm
      onSubmit={onSubmit}
      onCancel={onCancel}
      defaultValues={{
        title: "",
        description: "",
        startDate: new Date(),
        isPrivate: false,
        ...defaultValues,
      }}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      validationSchema={eventFormSchema}
      submitButtonText={defaultValues?.title ? "Save Changes" : "Create Event"}
      className={className}
    >
      <FormTextInput
        name="title"
        label="Event Title"
        placeholder="Enter event title"
        required
      />
      <FormTextareaInput
        name="description"
        label="Description"
        placeholder="Describe your event"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormDatePicker name="startDate" label="Start Date" required />
        <FormDatePicker name="endDate" label="End Date (Optional)" />
      </div>
      <FormTextInput
        name="location"
        label="Location"
        placeholder="Enter event location"
      />
      <FormCheckbox
        name="isPrivate"
        label="Private Event"
        description="When enabled, only invited members can see this event"
      />
    </EntityForm>
  );
}
