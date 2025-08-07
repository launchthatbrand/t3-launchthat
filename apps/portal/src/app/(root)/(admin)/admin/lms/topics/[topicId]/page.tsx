"use client";

import {
  AdminSinglePost,
  AdminSinglePostHeader,
  AdminSinglePostLayout,
  AdminSinglePostMain,
  AdminSinglePostSidebar,
  AdminSinglePostTabs,
  AdminSinglePostTabsContent,
  AdminSinglePostTabsList,
  AdminSinglePostTabsTrigger,
  MediaTabContent,
  SEOTabContent,
  VimeoTabContent,
} from "~/components/admin/AdminSinglePostLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Clock, Eye, EyeOff, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import type { Doc, Id } from "@convex-config/_generated/dataModel";
import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Label } from "@acme/ui/label";
import { MultiSelect } from "@acme/ui/components/multi-select";
import { Separator } from "@acme/ui/separator";
import { Switch } from "@acme/ui/switch";
import { TopicFormContent } from "../_components/TopicFormContent";
import type { TopicFormValues } from "../_components/TopicFormContent";
import { api } from "@convex-config/_generated/api";
import { toast } from "sonner";
import { useParams } from "next/navigation";

// Categories - using static for now, replace with API call later
const categories = [
  { value: "programming", label: "Programming" },
  { value: "design", label: "Design" },
  { value: "business", label: "Business" },
  { value: "marketing", label: "Marketing" },
];

export default function AdminTopicEditPage() {
  const params = useParams();
  const { topicId } = params as { topicId: string };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isNewTagModalOpen, setIsNewTagModalOpen] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [seoData, setSeoData] = useState({
    slug: "",
    metaTitle: "",
    metaDescription: "",
  });
  const [vimeoUrl, setVimeoUrl] = useState("");
  const [featuredImages, setFeaturedImages] = useState<any[]>([]);

  // Convex queries and mutations
  const topic = useQuery(api.lms.topics.index.getTopic, {
    id: topicId as Id<"topics">,
  });
  const tags = useQuery(api.tags.index.listTags, {});
  const createTag = useMutation(api.tags.index.createTag);
  const updateTopic = useMutation(api.lms.topics.index.updateTopic);

  // Initialize data when topic loads
  React.useEffect(() => {
    if (topic) {
      setSelectedTags(
        topic.tagIds?.map((id: Id<"tags">) => id.toString()) || [],
      );
      setFeaturedImageUrl(topic.featuredImage || "");
      setSeoData({
        slug: topic.slug || generateSlug(topic.title),
        metaTitle: topic.metaTitle || topic.title,
        metaDescription: topic.metaDescription || topic.excerpt || "",
      });
      setVimeoUrl(topic.vimeoUrl || "");
    }
  }, [topic]);

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Main save handler
  const handleSave = async () => {
    // This will be called by the header's save button
    // The form data will be submitted via the form's own onSave handler
  };

  // Form save handler
  const handleFormSave = async (data: unknown) => {
    const topicData = data as TopicFormValues;

    setIsSubmitting(true);
    try {
      if (!topic) {
        toast.error("Topic not found");
        return;
      }

      await updateTopic({
        id: topic._id,
        title: topicData.title,
        description: topicData.description,
        excerpt: topicData.excerpt,
        content: topicData.content,
        isPublished: topicData.isPublished || false,
        contentType: topicData.contentType || "text",
        featuredImage: topicData.featuredImage,
        featuredMedia: topicData.featuredMedia,
        categories: topicData.categories ? [topicData.categories] : [],
        menuOrder: topicData.menuOrder || 0,
        tagIds: selectedTags.map((id: string) => id as Id<"tags">),
        slug: seoData.slug,
        metaTitle: seoData.metaTitle,
        metaDescription: seoData.metaDescription,
        vimeoUrl: vimeoUrl,
      });

      toast.success("Topic updated successfully!");
    } catch (error) {
      console.error("Failed to update topic:", error);
      toast.error("Failed to update topic.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tag creation handler - temporarily disabled
  const handleCreateTag = async (values: any) => {
    setIsCreatingTag(true);
    try {
      const newTagId = await createTag(values);
      toast.success("Tag created successfully!");
      setSelectedTags((prev: string[]) => [...prev, newTagId.toString()]);
      setIsNewTagModalOpen(false);
    } catch (error) {
      console.error("Failed to create tag:", error);
      toast.error("Failed to create tag");
    } finally {
      setIsCreatingTag(false);
    }
  };

  // Loading state
  if (topic === undefined || tags === undefined) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
          <p className="mt-2 text-sm text-muted-foreground">Loading topic...</p>
        </div>
      </div>
    );
  }

  if (topic === null) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Topic not found</h2>
          <p className="text-muted-foreground">
            The requested topic could not be found.
          </p>
        </div>
      </div>
    );
  }

  // Prepare initial form data
  const initialFormValues = {
    title: topic.title,
    description: topic.description || "",
    excerpt: topic.excerpt || "",
    content: topic.content || "",
    isPublished: topic.isPublished || false,
    contentType: topic.contentType || "text",
    featuredImage: topic.featuredImage || "",
    featuredMedia: topic.featuredMedia,
    categories:
      topic.categories && topic.categories.length > 0
        ? topic.categories[0]
        : "",
    menuOrder: topic.menuOrder || 0,
    tagIds: topic.tagIds?.map((id: string) => id.toString()) || [],
  };

  // Tag options for MultiSelect
  const tagOptions = (tags || []).map((tag: Doc<"tags">) => ({
    value: tag._id.toString(),
    label: tag.name,
  }));

  // Sidebar content
  const sidebarContent = (
    <div className="space-y-4">
      {/* Publish Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Publication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status:</span>
              <Badge variant={topic.isPublished ? "default" : "secondary"}>
                {topic.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="published" checked={topic.isPublished} disabled />
              <Label htmlFor="published" className="text-sm">
                Published
              </Label>
            </div>

            {topic.featured && (
              <div className="flex items-center space-x-2">
                <Switch id="featured" checked={topic.featured} disabled />
                <Label htmlFor="featured" className="text-sm">
                  Featured topic
                </Label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Topic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Topic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground">Content Type</div>
            <Badge variant="outline">{topic.contentType || "text"}</Badge>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Menu Order</div>
            <div className="text-sm">{topic.menuOrder || 0}</div>
          </div>

          <Separator />

          <div>
            <div className="text-xs text-muted-foreground">Category</div>
            <div className="text-sm">
              {topic.categories?.length ? topic.categories[0] : "No category"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Tags</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {selectedTags.length > 0 ? (
                selectedTags.map((tagId: string) => {
                  const tag = tags?.find(
                    (t: Doc<"tags">) => t._id.toString() === tagId,
                  );
                  return tag ? (
                    <Badge key={tagId} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ) : null;
                })
              ) : (
                <span className="text-xs text-muted-foreground">No tags</span>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-xs text-muted-foreground">Created</div>
            <div className="text-sm">
              {new Date(topic._creationTime).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <AdminSinglePost
      postType="topic"
      postTitle={topic.title}
      isSubmitting={isSubmitting}
      onSave={handleSave}
      defaultTab="content"
    >
      <AdminSinglePostHeader
        backUrl="/admin/topics"
        saveButtonText="Save Topic"
      />

      <AdminSinglePostLayout>
        <AdminSinglePostMain>
          <AdminSinglePostTabs>
            <AdminSinglePostTabsList>
              <AdminSinglePostTabsTrigger value="content">
                Content
              </AdminSinglePostTabsTrigger>
              <AdminSinglePostTabsTrigger value="media">
                Media
              </AdminSinglePostTabsTrigger>
              <AdminSinglePostTabsTrigger value="vimeo">
                Vimeo
              </AdminSinglePostTabsTrigger>
              <AdminSinglePostTabsTrigger value="seo">
                SEO
              </AdminSinglePostTabsTrigger>
              <AdminSinglePostTabsTrigger value="settings">
                Settings
              </AdminSinglePostTabsTrigger>
            </AdminSinglePostTabsList>

            <AdminSinglePostTabsContent value="content">
              <TopicFormContent
                formData={initialFormValues}
                onSave={handleFormSave}
                isSubmitting={isSubmitting}
                availableTags={tags}
                categories={categories}
              />
            </AdminSinglePostTabsContent>

            <AdminSinglePostTabsContent value="media">
              <MediaTabContent
                images={featuredImages}
                onImageAdded={(image) =>
                  setFeaturedImages((prev) => [...prev, image])
                }
                onImageRemoved={(index) =>
                  setFeaturedImages((prev) =>
                    prev.filter((_, i) => i !== index),
                  )
                }
                onImageUpdated={(index, updates) =>
                  setFeaturedImages((prev) =>
                    prev.map((img, i) =>
                      i === index ? { ...img, ...updates } : img,
                    ),
                  )
                }
                maxFiles={1}
                acceptedFileTypes={["image/jpeg", "image/png", "image/webp"]}
                maxFileSize={2 * 1024 * 1024}
              />
            </AdminSinglePostTabsContent>

            <AdminSinglePostTabsContent value="vimeo">
              <VimeoTabContent
                currentUrl={vimeoUrl}
                onUrlChange={setVimeoUrl}
                placeholder="Enter Vimeo video URL"
              />
            </AdminSinglePostTabsContent>

            <AdminSinglePostTabsContent value="seo">
              <SEOTabContent
                slug={seoData.slug}
                metaTitle={seoData.metaTitle}
                metaDescription={seoData.metaDescription}
                onSlugChange={(slug) =>
                  setSeoData((prev) => ({ ...prev, slug }))
                }
                onMetaTitleChange={(title) =>
                  setSeoData((prev) => ({ ...prev, metaTitle: title }))
                }
                onMetaDescriptionChange={(desc) =>
                  setSeoData((prev) => ({ ...prev, metaDescription: desc }))
                }
                urlPreview="https://yoursite.com/topics/"
              />
            </AdminSinglePostTabsContent>

            <AdminSinglePostTabsContent value="settings">
              <div className="space-y-6">
                {/* Tags Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tags</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Assign Tags</Label>
                      <MultiSelect
                        options={tagOptions}
                        value={selectedTags}
                        onValueChange={setSelectedTags}
                        placeholder="Select tags"
                        className="mt-2"
                      />
                      <p className="mt-1 text-sm text-muted-foreground">
                        Select relevant global tags for this topic.
                      </p>
                    </div>

                    <Dialog
                      open={isNewTagModalOpen}
                      onOpenChange={setIsNewTagModalOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create New Tag
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Global Tag</DialogTitle>
                          <DialogDescription>
                            Define a new tag that can be used across various
                            content types.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="p-4 text-center text-muted-foreground">
                          Tag creation form temporarily disabled
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>
            </AdminSinglePostTabsContent>
          </AdminSinglePostTabs>
        </AdminSinglePostMain>

        <AdminSinglePostSidebar>{sidebarContent}</AdminSinglePostSidebar>
      </AdminSinglePostLayout>
    </AdminSinglePost>
  );
}
