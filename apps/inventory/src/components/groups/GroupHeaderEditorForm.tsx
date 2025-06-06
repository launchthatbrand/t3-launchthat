"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ImagePlus, Plus, RefreshCw, Trash } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Textarea } from "@acme/ui/textarea";

import type { Id } from "../../../convex/_generated/dataModel";
import type {
  CarouselItem,
  CarouselItemTemplate,
  TextAlignmentOption,
  VerticalAlignmentOption,
} from "./GroupHeaderCarousel";
import { api } from "../../../convex/_generated/api";
import useCarouselStore from "../../store/useCarouselStore";
import { SlideSettingsPanel } from "./SlideSettingsPanel";

// Feed item interface based on the actual API response
interface FeedItem {
  _id: Id<"feedItems">;
  content: string;
  reactionsCount: number;
  commentsCount: number;
  creator: {
    _id: Id<"users">;
    name: string;
    image?: string;
  };
  mediaUrls?: string[];
}

interface GroupHeaderEditorFormProps {
  groupId: Id<"groups">;
  onSave: (items: CarouselItem[]) => void;
}

export function GroupHeaderEditorForm({
  groupId,
  onSave,
}: GroupHeaderEditorFormProps) {
  const {
    items,
    setItems,
    expandedAccordionItem,
    setExpandedAccordionItem,
    updateItem,
  } = useCarouselStore();

  const [isLoading, setIsLoading] = useState(false);

  // Fetch feed posts for selection using an existing query with pagination
  const feedItemsResult = useQuery(api.socialfeed.queries.getUniversalFeed, {
    paginationOpts: { numItems: 50, cursor: null },
  });

  // Ensure proper typing for feed items
  const feedItems: FeedItem[] = feedItemsResult ?? [];

  // Update group mutation
  const updateGroup = useMutation(api.groups.mutations.updateGroup);

  // Handle accordion value change
  const handleAccordionChange = (value: string) => {
    setExpandedAccordionItem(value);
  };

  // Handle adding a new item
  const handleAddItem = () => {
    const newItem: CarouselItem = {
      id: uuidv4(),
      title: "",
      excerpt: "",
      imageUrl: "https://placehold.co/600x400/png",
      template: "overlay",
      textAlign: "left",
      verticalAlign: "middle",
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    };

    const newItems = [...items, newItem];
    setItems(newItems);

    // Focus the new item using setExpandedAccordionItem
    setExpandedAccordionItem(newItem.id);
  };

  // Handle removing an item
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      // Don't allow removing the last item
      return;
    }

    const index = items.findIndex((item) => item.id === id);
    const newItems = items.filter((item) => item.id !== id);
    setItems(newItems);

    // Select a new item to focus if we removed the currently open one
    if (id === expandedAccordionItem && newItems.length > 0) {
      const newIndex = Math.min(index, newItems.length - 1);
      const newItemId = newItems[newIndex]?.id;

      // Make sure we have a valid ID before syncing
      if (newItemId) {
        setExpandedAccordionItem(newItemId);
      }
    }
  };

  // Handle updating an item
  const handleUpdateItem = (id: string, updates: Partial<CarouselItem>) => {
    // Use the store's updateItem method for immediate updates
    updateItem(id, updates);
  };

  // Handle importing from a feed post
  const handleImportFromBlog = (id: string, feedItemId: string) => {
    const feedItem = feedItems.find((post) => post._id === feedItemId);
    if (feedItem) {
      handleUpdateItem(id, {
        title: feedItem.creator.name,
        excerpt:
          feedItem.content.substring(0, 100).replace(/<[^>]*>/g, "") || "",
        imageUrl: feedItem.mediaUrls?.[0] ?? "https://placehold.co/600x400/png",
        blogPostId: feedItemId,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // Make sure we have at least one item
      if (items.length === 0) {
        const defaultItem: CarouselItem = {
          id: uuidv4(),
          title: "",
          excerpt: "",
          imageUrl: "https://placehold.co/600x400/png",
          template: "overlay",
          textAlign: "left",
          verticalAlign: "middle",
          padding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          },
        };
        setItems([defaultItem]);
        return;
      }

      // Save to the database
      await updateGroup({
        groupId,
        headerItems: items,
      });

      // Call the onSave callback
      onSave(items);
    } catch (error) {
      console.error("Error saving header:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Accordion
        type="single"
        value={expandedAccordionItem ?? undefined}
        onValueChange={handleAccordionChange}
        className="w-full"
        collapsible
      >
        {items.map((item, index) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger className="px-4">
              <div className="flex w-full items-center justify-between">
                <span>
                  Slide {index + 1}: {item.title ?? "Untitled"}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t px-4 pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`title-${item.id}`}>Title</Label>
                    <Input
                      id={`title-${item.id}`}
                      value={item.title ?? ""}
                      onChange={(e) =>
                        handleUpdateItem(item.id, { title: e.target.value })
                      }
                      placeholder="Slide title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`template-${item.id}`}>Template</Label>
                    <Select
                      value={item.template}
                      onValueChange={(value: CarouselItemTemplate) =>
                        handleUpdateItem(item.id, { template: value })
                      }
                    >
                      <SelectTrigger id={`template-${item.id}`}>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inline">
                          Inline (2 columns)
                        </SelectItem>
                        <SelectItem value="stacked">
                          Stacked (Image top, text bottom)
                        </SelectItem>
                        <SelectItem value="overlay">
                          Overlay (Text over image)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <SlideSettingsPanel
                  item={item}
                  onUpdate={(updates) => handleUpdateItem(item.id, updates)}
                />

                <div className="space-y-2">
                  <Label htmlFor={`excerpt-${item.id}`}>Excerpt</Label>
                  <Textarea
                    id={`excerpt-${item.id}`}
                    value={item.excerpt ?? ""}
                    onChange={(e) =>
                      handleUpdateItem(item.id, { excerpt: e.target.value })
                    }
                    placeholder="Short description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`image-${item.id}`}>Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`image-${item.id}`}
                      value={item.imageUrl}
                      onChange={(e) =>
                        handleUpdateItem(item.id, { imageUrl: e.target.value })
                      }
                      placeholder="https://example.com/image.jpg"
                    />
                    <Button size="icon" variant="outline" type="button">
                      <ImagePlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`blog-${item.id}`}>
                    Import from Social Feed Post
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(value) =>
                        handleImportFromBlog(item.id, value)
                      }
                    >
                      <SelectTrigger id={`blog-${item.id}`} className="w-full">
                        <SelectValue placeholder="Select a post" />
                      </SelectTrigger>
                      <SelectContent>
                        {feedItems.map((post) => (
                          <SelectItem key={post._id} value={post._id}>
                            {post.content.substring(0, 30)}...
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        if (item.blogPostId) {
                          handleImportFromBlog(item.id, item.blogPostId);
                        }
                      }}
                      disabled={!item.blogPostId}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  type="button"
                  className="mt-2"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={items.length <= 1}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Remove Slide
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex flex-col gap-4">
        <Button
          variant="outline"
          type="button"
          className="mt-4"
          onClick={handleAddItem}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Slide
        </Button>

        <div className="flex justify-end gap-2">
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
