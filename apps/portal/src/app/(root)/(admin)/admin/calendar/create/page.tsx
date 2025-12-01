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
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";

import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { ColorPicker } from "./_components/ColorPicker";

const calendarSchema = z.object({
  name: z.string().min(1, "Calendar name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  isDefault: z.boolean().default(false),
  isPublic: z.boolean().default(false),
});

type CalendarFormValues = z.infer<typeof calendarSchema>;

export default function NewCalendarPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCalendar = useMutation(api.plugins.calendar.crud.createCalendar);

  const form = useForm<CalendarFormValues>({
    resolver: zodResolver(calendarSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#0ea5e9", // Default blue color
      isDefault: false,
      isPublic: false,
    },
  });

  const onSubmit = async (data: CalendarFormValues) => {
    if (!user?.id) {
      toast.error("You must be logged in to create a calendar");
      return;
    }

    setIsSubmitting(true);

    try {
      await createCalendar({
        name: data.name,
        description: data.description,
        color: data.color,
        ownerId: user.id, // Using the user ID from Clerk
        ownerType: "user",
        isDefault: data.isDefault,
        isPublic: data.isPublic,
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
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Sign in to create a calendar</h2>
          <p className="text-muted-foreground mt-2">
            You need to be signed in to create and manage calendars
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Calendar</h1>
        <p className="text-muted-foreground">
          Add a new calendar to organize your events
        </p>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Calendar Details</CardTitle>
          <CardDescription>
            Enter the details for your new calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calendar Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter calendar name" {...field} />
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
                      <Textarea
                        placeholder="Enter calendar description"
                        className="h-24"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
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
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: field.value }}
                        />
                        <Input type="color" {...field} className="h-10 w-20" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Default Calendar</FormLabel>
                      <FormDescription>
                        Make this your default calendar for new events
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Public Calendar</FormLabel>
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

              <CardFooter className="flex justify-between px-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/calendar")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <LoadingSpinner /> : "Create Calendar"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
