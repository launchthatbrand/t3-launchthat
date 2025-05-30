"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Switch } from "@acme/ui";
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
import { Textarea } from "@acme/ui/textarea";

import { ColorPicker } from "./_components/ColorPicker";

const formSchema = z.object({
  name: z.string().min(1, { message: "Calendar name is required" }),
  description: z.string().optional(),
  color: z.string(),
  isDefault: z.boolean().default(false),
  isPublic: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewCalendarPage() {
  const router = useRouter();
  const { user } = useUser();
  const createCalendar = useMutation(api.calendar.crud.createCalendar);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set up form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#4f46e5", // Default indigo color
      isDefault: false,
      isPublic: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user?.id) {
      toast.error("You must be logged in to create a calendar");
      return;
    }

    try {
      setIsSubmitting(true);

      // Create the calendar
      await createCalendar({
        name: values.name,
        description: values.description,
        color: values.color,
        ownerId: user.id,
        ownerType: "user",
        isDefault: values.isDefault,
        isPublic: values.isPublic,
      });

      toast.success("Calendar created successfully");
      router.push("/calendar");
    } catch (error) {
      console.error("Error creating calendar:", error);
      toast.error("Failed to create calendar");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Please log in to create a calendar</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Create New Calendar</CardTitle>
          <CardDescription>
            Add a new calendar to organize your events
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calendar Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Calendar" {...field} />
                    </FormControl>
                    <FormDescription>
                      Give your calendar a descriptive name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Calendar description..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide details about what this calendar will be used for
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calendar Color</FormLabel>
                    <FormControl>
                      <ColorPicker
                        color={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      Select a color to identify this calendar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Default Calendar
                        </FormLabel>
                        <FormDescription>
                          Use this as your default calendar for new events
                        </FormDescription>
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
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Public Calendar
                        </FormLabel>
                        <FormDescription>
                          Make this calendar visible to everyone
                        </FormDescription>
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
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/calendar")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Calendar"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
