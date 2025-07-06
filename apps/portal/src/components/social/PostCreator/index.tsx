"use client";

import { useEffect, useState } from "react";
import { Editor } from "@/components/blocks/editor-x/editor";
import { useAuth } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { Calendar, Loader2, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { SerializedEditorState } from "@acme/ui/components/blocks/editor-00";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@acme/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { Id } from "../../../../convex/_generated/dataModel";
import type { MediaItem } from "./MediaUpload";
import type {
  Visibility,
  ModuleType as VisibilitySelectorModuleType,
} from "./VisibilitySelector";
import { api } from "../../../../convex/_generated/api";
import { MediaUpload } from "./MediaUpload";
import { VisibilitySelector } from "./VisibilitySelector";

// Form validation schema
const postFormSchema = z.object({
  content: z.any(), // Change from z.string() to z.any() to accommodate the SerializedEditorState
});

type FormValues = z.infer<typeof postFormSchema>;

interface PostCreatorProps {
  /** Post ID to edit, omit for creating a new post */
  postId?: Id<"feedItems">;
  /** Group ID if creating post in a group context */
  groupId?: Id<"groups">;
  /** Whether to auto-focus the editor when mounted */
  autoFocus?: boolean;
  /** Callback when post is created or updated */
  onSuccess?: (postId: Id<"feedItems">) => void;
  /** Callback when post creation/editing is cancelled */
  onCancel?: () => void;
  /** Max height of the editor in CSS units */
  maxHeight?: string;
  /** Optional class name to apply to the container */
  className?: string;
}

// Mock types for API response until proper types are available
interface Group {
  _id: string;
  name: string;
}

// Define our own types to match the backend
type AppVisibility = "public" | "private" | "group";
type AppModuleType = "blog" | "course" | "group" | "event" | undefined;

// Define Post type locally
interface Post {
  content: string;
  mediaUrls?: string[];
  visibility: AppVisibility;
  moduleType?: AppModuleType;
  moduleId?: string;
}

export const initialValue = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Hello World 🚀",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
} as unknown as SerializedEditorState;

export function PostCreator({
  postId,
  groupId,
  autoFocus = false,
  onSuccess,
  onCancel,
  maxHeight = "300px",
  className = "",
}: PostCreatorProps) {
  // Auth context for user ID
  const { userId: clerkUserId } = useAuth();
  console.log("clerkUserId", clerkUserId);

  // Convert Clerk user ID to Convex user ID
  const convexUser = useQuery(
    api.users.queries.getUserByClerkId,
    clerkUserId ? { clerkId: clerkUserId } : "skip",
  );

  console.log("convexUser", convexUser);

  // State
  const [activeTab, setActiveTab] = useState<"text" | "media">("text");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [visibility, setVisibility] = useState<AppVisibility>("public");
  const [moduleType, setModuleType] = useState<AppModuleType>(undefined);
  const [moduleId, setModuleId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!postId);

  const [editorState, setEditorState] =
    useState<SerializedEditorState>(initialValue);

  // Fetch user's groups - using any temporarily until proper types are available
  const groups = (useQuery(
    api.groups.queries.getUserGroups,
    convexUser?._id ? { userId: convexUser._id } : "skip",
  ) ?? []) as Group[];

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      content: postId
        ? ""
        : ({
            root: {
              children: [
                {
                  children: [
                    {
                      detail: 0,
                      format: 0,
                      mode: "normal",
                      style: "",
                      text: "",
                      type: "text",
                      version: 1,
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
              ],
              direction: "ltr",
              format: "",
              indent: 0,
              type: "root",
              version: 1,
            },
          } as unknown as string),
    },
  });

  // Mutations
  const createPost = useMutation(api.socialfeed.mutations.createPost);
  const updatePost = useMutation(api.socialfeed.mutations.updatePost);

  // If editing, fetch the existing post - using any temporarily until proper types are available
  const existingPost = useQuery(
    api.socialfeed.queries.getFeedItem,
    postId ? { feedItemId: postId, viewerId: convexUser?._id } : "skip",
  ) as Post | undefined;

  // Initialize form and state with existing post data
  useEffect(() => {
    if (postId && existingPost) {
      setIsLoading(false);

      // Try to parse the content as a SerializedEditorState
      let contentValue;
      try {
        contentValue =
          typeof existingPost.content === "string" &&
          existingPost.content.trim().startsWith("{")
            ? JSON.parse(existingPost.content)
            : {
                root: {
                  children: [
                    {
                      children: [
                        {
                          detail: 0,
                          format: 0,
                          mode: "normal",
                          style: "",
                          text: existingPost.content || "",
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "paragraph",
                      version: 1,
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "root",
                  version: 1,
                },
              };
      } catch (error) {
        console.error("Error parsing post content:", error);
        contentValue = {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: existingPost.content || "",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "paragraph",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1,
          },
        };
      }

      form.setValue("content", contentValue as unknown as string);

      // Set other state from post
      if (existingPost.mediaUrls && existingPost.mediaUrls.length > 0) {
        const newMediaItems: MediaItem[] = existingPost.mediaUrls.map(
          (url) => ({
            url,
            type: url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "image" : "video",
          }),
        );
        setMediaItems(newMediaItems);
        setActiveTab("media");
      } else {
        setActiveTab("text");
      }

      // Set visibility and module details
      if (existingPost.visibility) {
        setVisibility(existingPost.visibility as AppVisibility);
      }

      if (existingPost.moduleType) {
        setModuleType(existingPost.moduleType as AppModuleType);
      }

      if (existingPost.moduleId) {
        setModuleId(existingPost.moduleId);
      }
    } else if (groupId) {
      // If creating a post in a group context, set the visibility and module info
      setVisibility("group");
      setModuleType("group");
      setModuleId(groupId);
    }
  }, [form, existingPost, postId, groupId]);

  // Handle visibility change
  const handleVisibilityChange = (newVisibility: Visibility) => {
    // Only accept visibility values that match our backend
    if (
      newVisibility === "public" ||
      newVisibility === "private" ||
      newVisibility === "group"
    ) {
      setVisibility(newVisibility);
    } else {
      // Default to public for unsupported values
      setVisibility("public");
    }
  };

  // Update the module change handler
  const handleModuleChange = (
    newModuleType: VisibilitySelectorModuleType | undefined,
    newModuleId: string | undefined,
  ) => {
    // Convert VisibilitySelectorModuleType to AppModuleType
    setModuleType(newModuleType as AppModuleType);
    setModuleId(newModuleId);
  };

  // Handle media add/remove
  const handleMediaAdded = (media: MediaItem) => {
    setMediaItems((prev) => [...prev, media]);
    setActiveTab("text"); // Switch back to text tab after adding media
  };

  const handleMediaRemoved = (index: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    if (!convexUser || !convexUser._id) {
      toast.error("You must be logged in to create a post");
      return;
    }

    try {
      setIsSubmitting(true);

      // Extract media URLs from media items
      const mediaUrls = mediaItems.map((item) => item.url);

      // Convert content to HTML or string format if needed
      // For now, we'll stringify the serialized state
      const contentStr =
        typeof values.content === "string"
          ? values.content
          : JSON.stringify(values.content);

      // For a new post
      if (!postId) {
        const newPostId = await createPost({
          creatorId: convexUser._id,
          content: contentStr,
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
          visibility,
          moduleType,
          moduleId,
        });

        toast.success("Post created successfully");

        if (onSuccess) {
          onSuccess(newPostId);
        }

        // Reset the form
        form.reset({
          content: {
            root: {
              children: [
                {
                  children: [
                    {
                      detail: 0,
                      format: 0,
                      mode: "normal",
                      style: "",
                      text: "",
                      type: "text",
                      version: 1,
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
              ],
              direction: "ltr",
              format: "",
              indent: 0,
              type: "root",
              version: 1,
            },
          } as unknown as string,
        });
        setMediaItems([]);
        setActiveTab("text");
      } else {
        await updatePost({
          postId,
          userId: convexUser._id,
          content: contentStr,
          mediaUrls: mediaItems.length > 0 ? mediaUrls : undefined,
          visibility,
        });

        toast.success("Post updated successfully");

        if (onSuccess) {
          onSuccess(postId);
        }
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      toast.error("Failed to submit post");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {postId ? "Edit Post" : "Create Post"}
              </CardTitle>
              <VisibilitySelector
                visibility={visibility}
                onVisibilityChange={handleVisibilityChange}
                moduleId={moduleId}
                onModuleChange={handleModuleChange}
              />
            </div>
          </CardHeader>

          <CardContent className="pb-0">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "text" | "media")}
            >
              <TabsList className="mb-2 w-full">
                <TabsTrigger value="text" className="flex-1">
                  Content
                </TabsTrigger>
                <TabsTrigger value="media" className="flex-1">
                  Media
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Editor
                          editorSerializedState={editorState}
                          onSerializedChange={(value) => setEditorState(value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="media">
                <MediaUpload
                  onMediaAdded={handleMediaAdded}
                  onMediaRemoved={handleMediaRemoved}
                  mediaItems={mediaItems}
                />
              </TabsContent>
            </Tabs>

            {/* Media preview in the text tab */}
            {activeTab === "text" && mediaItems.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Attached Media</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setActiveTab("media")}
                  >
                    Edit
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {mediaItems.map((media, index) => (
                    <div
                      key={index}
                      className="relative aspect-video rounded-md bg-muted"
                    >
                      {media.type === "image" ? (
                        <img
                          src={media.url}
                          alt={media.name ?? `Media ${index + 1}`}
                          className="h-full w-full rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            {media.name ?? "File"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between pt-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled
              >
                <Calendar className="h-4 w-4" />
                <span>Schedule</span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}

              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>{postId ? "Updating..." : "Posting..."}</span>
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    <span>{postId ? "Update" : "Post"}</span>
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
