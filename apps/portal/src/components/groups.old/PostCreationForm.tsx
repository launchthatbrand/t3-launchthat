"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { File, Image, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@acme/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { FileUpload } from "./FileUpload";

// Form validation schema
const postFormSchema = z.object({
  content: z
    .string()
    .min(1, "Post content cannot be empty")
    .max(5000, "Post content is too long"),
});

// Define attachment types
interface AttachmentType {
  type: "image" | "video" | "file";
  url: string;
  name?: string;
  size?: number;
}

// Define post type for consistency with GroupFeed
interface GroupPost {
  _id: Id<"groupPosts">;
  _creationTime: number;
  groupId: Id<"groups">;
  authorId: Id<"users">;
  content: string;
  authorName: string;
  authorImageUrl?: string;
  pinnedAt?: number;
  attachments?: AttachmentType[];
  likesCount: number;
  commentsCount: number;
  hasLiked: boolean;
  isHidden?: boolean;
}

interface PostCreationFormProps {
  groupId: Id<"groups">;
  onPostCreated?: (post: GroupPost) => void;
  onCancel?: () => void;
}

export function PostCreationForm({
  groupId,
  onPostCreated,
  onCancel,
}: PostCreationFormProps) {
  const [attachments, setAttachments] = useState<AttachmentType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "upload">("text");

  // Set up the form
  const form = useForm<z.infer<typeof postFormSchema>>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      content: "",
    },
  });

  // Get the Convex mutation
  const createPost = useMutation(api.groups.posts.createGroupPost);

  // Handle file uploads
  const handleFileUploaded = (fileData: {
    url: string;
    type: "image" | "video" | "file";
    name?: string;
    size?: number;
  }) => {
    setAttachments((prev) => [...prev, fileData]);
    setActiveTab("text"); // Switch back to text tab after adding file
  };

  // Remove an attachment
  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof postFormSchema>) => {
    try {
      setIsSubmitting(true);

      // Create the post on the server
      const postId = await createPost({
        groupId,
        content: values.content,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      // Call the callback with the new post data
      if (onPostCreated) {
        onPostCreated({
          _id: postId,
          _creationTime: Date.now(),
          groupId,
          authorId: "" as Id<"users">, // Will be filled by backend
          content: values.content,
          authorName: "", // Will be filled by backend
          attachments,
          likesCount: 0,
          commentsCount: 0,
          hasLiked: false,
        });
      }

      // Reset the form
      form.reset();
      setAttachments([]);
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "text" | "upload")}
          >
            <TabsList className="mb-2">
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="upload">Attachments</TabsTrigger>
            </TabsList>

            <TabsContent value="text">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Share something with the group..."
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent value="upload">
              <FileUpload onFileUploaded={handleFileUploaded} />
            </TabsContent>
          </Tabs>

          {/* Display attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Attachments:</p>
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="relative flex items-center gap-2 rounded-md border border-border bg-muted p-2 pr-8 text-sm"
                  >
                    {attachment.type === "image" ? (
                      <Image className="h-4 w-4" />
                    ) : (
                      <File className="h-4 w-4" />
                    )}
                    <span className="max-w-[120px] truncate">
                      {attachment.name ?? "File"}
                    </span>
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded-full p-1 hover:bg-muted-foreground/20"
                      onClick={() => handleRemoveAttachment(index)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
