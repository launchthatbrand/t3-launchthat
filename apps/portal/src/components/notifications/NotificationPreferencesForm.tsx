"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
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
import { Checkbox } from "@acme/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@acme/ui/form";
import { Skeleton } from "@acme/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

// Define the schema for notification preferences
const notificationPreferencesSchema = z.object({
  email: z.object({
    activity: z.boolean().default(true),
    group: z.boolean().default(true),
    system: z.boolean().default(true),
    event: z.boolean().default(true),
    ecommerce: z.boolean().default(true),
    feedReactions: z.boolean().default(true),
    feedComments: z.boolean().default(true),
    feedMentions: z.boolean().default(true),
    feedShares: z.boolean().default(true),
    newFollowedPosts: z.boolean().default(false),
  }),
  push: z.object({
    activity: z.boolean().default(true),
    group: z.boolean().default(true),
    system: z.boolean().default(true),
    event: z.boolean().default(true),
    ecommerce: z.boolean().default(true),
    feedReactions: z.boolean().default(true),
    feedComments: z.boolean().default(true),
    feedMentions: z.boolean().default(true),
    feedShares: z.boolean().default(true),
    newFollowedPosts: z.boolean().default(false),
  }),
  inApp: z.object({
    activity: z.boolean().default(true),
    group: z.boolean().default(true),
    system: z.boolean().default(true),
    event: z.boolean().default(true),
    ecommerce: z.boolean().default(true),
    feedReactions: z.boolean().default(true),
    feedComments: z.boolean().default(true),
    feedMentions: z.boolean().default(true),
    feedShares: z.boolean().default(true),
    newFollowedPosts: z.boolean().default(true),
  }),
});

type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

// Define the API response interface for notification preferences
interface ApiNotificationPreferences {
  _id: Id<"notificationPreferences">;
  _creationTime: number;
  userId: Id<"users">;
  pushEnabled?: boolean;
  pushToken?: string;
  emailPreferences?: {
    activity?: boolean;
    group?: boolean;
    system?: boolean;
    event?: boolean;
    ecommerce?: boolean;
    feedReactions?: boolean;
    feedComments?: boolean;
    feedMentions?: boolean;
    feedShares?: boolean;
    newFollowedPosts?: boolean;
    [key: string]: boolean | undefined;
  };
  appPreferences?: {
    activity?: boolean;
    group?: boolean;
    system?: boolean;
    event?: boolean;
    ecommerce?: boolean;
    feedReactions?: boolean;
    feedComments?: boolean;
    feedMentions?: boolean;
    feedShares?: boolean;
    newFollowedPosts?: boolean;
    [key: string]: boolean | undefined;
  };
  pushPreferences?: {
    activity?: boolean;
    group?: boolean;
    system?: boolean;
    event?: boolean;
    ecommerce?: boolean;
    feedReactions?: boolean;
    feedComments?: boolean;
    feedMentions?: boolean;
    feedShares?: boolean;
    newFollowedPosts?: boolean;
    [key: string]: boolean | undefined;
  };
}

interface NotificationPreferencesFormProps {
  userId?: string;
}

export function NotificationPreferencesForm({
  userId,
}: NotificationPreferencesFormProps) {
  const [activeTab, setActiveTab] = useState("inApp");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current notification preferences
  const preferencesQuery = useQuery(
    api.core.notifications.preferences.getNotificationPreferences,
    userId ? { userId: userId as Id<"users"> } : "skip",
  );

  // Mutation to update preferences
  const updatePreferences = useMutation(
    api.core.notifications.preferences.updateNotificationPreferences,
  );

  // Default values for the form
  const defaultPreferences: NotificationPreferences = {
    email: {
      activity: true,
      group: true,
      system: true,
      event: true,
      ecommerce: false,
      feedReactions: true,
      feedComments: true,
      feedMentions: true,
      feedShares: true,
      newFollowedPosts: false,
    },
    push: {
      activity: true,
      group: true,
      system: true,
      event: true,
      ecommerce: false,
      feedReactions: true,
      feedComments: true,
      feedMentions: true,
      feedShares: true,
      newFollowedPosts: false,
    },
    inApp: {
      activity: true,
      group: true,
      system: true,
      event: true,
      ecommerce: true,
      feedReactions: true,
      feedComments: true,
      feedMentions: true,
      feedShares: true,
      newFollowedPosts: true,
    },
  };

  // Convert API response format to form format
  const mapApiToFormValues = (
    apiPreferences: ApiNotificationPreferences | null,
  ): NotificationPreferences => {
    if (!apiPreferences) return defaultPreferences;

    return {
      email: {
        activity: apiPreferences.emailPreferences?.activity ?? true,
        group: apiPreferences.emailPreferences?.group ?? true,
        system: apiPreferences.emailPreferences?.system ?? true,
        event: apiPreferences.emailPreferences?.event ?? true,
        ecommerce: apiPreferences.emailPreferences?.ecommerce ?? false,
        feedReactions: apiPreferences.emailPreferences?.feedReactions ?? true,
        feedComments: apiPreferences.emailPreferences?.feedComments ?? true,
        feedMentions: apiPreferences.emailPreferences?.feedMentions ?? true,
        feedShares: apiPreferences.emailPreferences?.feedShares ?? true,
        newFollowedPosts:
          apiPreferences.emailPreferences?.newFollowedPosts ?? false,
      },
      push: {
        activity: apiPreferences.pushPreferences?.activity ?? true,
        group: apiPreferences.pushPreferences?.group ?? true,
        system: apiPreferences.pushPreferences?.system ?? true,
        event: apiPreferences.pushPreferences?.event ?? true,
        ecommerce: apiPreferences.pushPreferences?.ecommerce ?? false,
        feedReactions: apiPreferences.pushPreferences?.feedReactions ?? true,
        feedComments: apiPreferences.pushPreferences?.feedComments ?? true,
        feedMentions: apiPreferences.pushPreferences?.feedMentions ?? true,
        feedShares: apiPreferences.pushPreferences?.feedShares ?? true,
        newFollowedPosts:
          apiPreferences.pushPreferences?.newFollowedPosts ?? false,
      },
      inApp: {
        activity: apiPreferences.appPreferences?.activity ?? true,
        group: apiPreferences.appPreferences?.group ?? true,
        system: apiPreferences.appPreferences?.system ?? true,
        event: apiPreferences.appPreferences?.event ?? true,
        ecommerce: apiPreferences.appPreferences?.ecommerce ?? true,
        feedReactions: apiPreferences.appPreferences?.feedReactions ?? true,
        feedComments: apiPreferences.appPreferences?.feedComments ?? true,
        feedMentions: apiPreferences.appPreferences?.feedMentions ?? true,
        feedShares: apiPreferences.appPreferences?.feedShares ?? true,
        newFollowedPosts:
          apiPreferences.appPreferences?.newFollowedPosts ?? true,
      },
    };
  };

  // Convert form format to API format
  const mapFormToApiValues = (formValues: NotificationPreferences) => {
    return {
      emailPreferences: {
        activity: formValues.email.activity,
        group: formValues.email.group,
        system: formValues.email.system,
        event: formValues.email.event,
        ecommerce: formValues.email.ecommerce,
        feedReactions: formValues.email.feedReactions,
        feedComments: formValues.email.feedComments,
        feedMentions: formValues.email.feedMentions,
        feedShares: formValues.email.feedShares,
        newFollowedPosts: formValues.email.newFollowedPosts,
      },
      appPreferences: {
        activity: formValues.inApp.activity,
        group: formValues.inApp.group,
        system: formValues.inApp.system,
        event: formValues.inApp.event,
        ecommerce: formValues.inApp.ecommerce,
        feedReactions: formValues.inApp.feedReactions,
        feedComments: formValues.inApp.feedComments,
        feedMentions: formValues.inApp.feedMentions,
        feedShares: formValues.inApp.feedShares,
        newFollowedPosts: formValues.inApp.newFollowedPosts,
      },
      pushEnabled: true, // We'll keep this enabled by default
      pushPreferences: {
        activity: formValues.push.activity,
        group: formValues.push.group,
        system: formValues.push.system,
        event: formValues.push.event,
        ecommerce: formValues.push.ecommerce,
        feedReactions: formValues.push.feedReactions,
        feedComments: formValues.push.feedComments,
        feedMentions: formValues.push.feedMentions,
        feedShares: formValues.push.feedShares,
        newFollowedPosts: formValues.push.newFollowedPosts,
      },
    };
  };

  // Setup react-hook-form
  const form = useForm<NotificationPreferences>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: defaultPreferences,
  });

  // Update form values when preferences load
  useEffect(() => {
    if (preferencesQuery) {
      const formattedValues = mapApiToFormValues(preferencesQuery);
      form.reset(formattedValues);
    }
  }, [preferencesQuery, form]);

  // Handle form submission
  const onSubmit = async (data: NotificationPreferences) => {
    if (!userId) return;

    setIsSubmitting(true);

    try {
      await updatePreferences({
        userId: userId as Id<"users">,
        ...mapFormToApiValues(data),
      });

      toast.success("Notification preferences updated");
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast.error("Failed to update preferences. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If not logged in, show message
  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Sign in to manage your notification preferences
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // If loading, show skeleton
  if (preferencesQuery === undefined) {
    return <PreferencesFormSkeleton />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose how and when you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="inApp">In-App</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="push">Push</TabsTrigger>
              </TabsList>

              {/* In-App Notifications Tab */}
              <TabsContent value="inApp" className="mt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="inApp.activity"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Activity Notifications</FormLabel>
                        <FormDescription>
                          Receive notifications about likes, comments, mentions,
                          shares, and other feed interactions.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Feed notifications specific settings */}
                <div className="ml-8 space-y-4">
                  <FormField
                    control={form.control}
                    name="inApp.feedReactions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Reactions to my posts</FormLabel>
                          <FormDescription>
                            Get notified when someone reacts to your posts or
                            comments
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inApp.feedComments"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Comments on my posts</FormLabel>
                          <FormDescription>
                            Get notified when someone comments on your posts
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inApp.feedMentions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Mentions</FormLabel>
                          <FormDescription>
                            Get notified when someone mentions you in a post or
                            comment
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inApp.feedShares"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Shares</FormLabel>
                          <FormDescription>
                            Get notified when someone shares your content
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inApp.newFollowedPosts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            New posts from people you follow
                          </FormLabel>
                          <FormDescription>
                            Get notified when people you follow post new content
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="inApp.group"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Group Notifications</FormLabel>
                        <FormDescription>
                          Receive notifications about group invitations,
                          updates, and messages.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inApp.system"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>System Notifications</FormLabel>
                        <FormDescription>
                          Receive important system notifications and updates.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inApp.event"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Event Notifications</FormLabel>
                        <FormDescription>
                          Receive notifications about upcoming events and
                          reminders.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inApp.ecommerce"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>E-commerce Notifications</FormLabel>
                        <FormDescription>
                          Receive notifications about orders, products, and
                          promotions.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Email Notifications Tab */}
              <TabsContent value="email" className="mt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="email.activity"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Activity Emails</FormLabel>
                        <FormDescription>
                          Receive email notifications about likes, comments,
                          mentions, shares, and other feed interactions.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Push Notifications Tab */}
              <TabsContent value="push" className="mt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="push.activity"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Activity Push Notifications</FormLabel>
                        <FormDescription>
                          Receive push notifications about likes, comments,
                          mentions, shares, and other feed interactions.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Preferences"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

// Loading skeleton
function PreferencesFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[350px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-6 h-10 w-full" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-[120px]" />
      </CardFooter>
    </Card>
  );
}
