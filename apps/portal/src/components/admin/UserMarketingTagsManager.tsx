"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import { useState } from "react";
import { Plus, Tag, X } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
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
import { toast } from "@acme/ui/toast";

import { useConvexUser } from "~/hooks/useConvexUser";
import {
  useMarketingTags,
  useUserMarketingTags,
} from "~/hooks/useMarketingTags";

interface UserMarketingTagsManagerProps {
  userId: Id<"users">;
}

const PREDEFINED_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
];

const PREDEFINED_CATEGORIES = [
  "Engagement",
  "Purchase History",
  "Demographics",
  "Behavior",
  "Course Progress",
  "Email Marketing",
  "Lead Source",
  "Customer Status",
];

export function UserMarketingTagsManager({
  userId,
}: UserMarketingTagsManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [createNewTagMode, setCreateNewTagMode] = useState(false);
  const [newTagData, setNewTagData] = useState({
    name: "",
    description: "",
    category: "",
    color: "#3b82f6",
  });

  // Get user's current marketing tags
  const { userTags, assignTag, removeTag } = useUserMarketingTags(userId);
  const { marketingTags, createTag } = useMarketingTags();
  const { convexId: actingUserId } = useConvexUser();

  // Filter out tags that user already has
  const availableTags =
    marketingTags?.filter(
      (tag) =>
        !userTags?.some((userTag) => userTag.marketingTag._id === tag._id),
    ) ?? [];

  const handleCreateAndAssignTag = async () => {
    if (!newTagData.name.trim()) {
      toast.error("Tag name is required");
      return;
    }

    try {
      // Create the new tag
      const newTagId = await createTag({
        name: newTagData.name.trim(),
        slug: newTagData.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        description: newTagData.description.trim() || undefined,
        color: newTagData.color,
        category: newTagData.category || undefined,
        isActive: true,
      });

      // Assign the newly created tag to the user
      await assignTag({
        userId,
        tagId: newTagId,
        source: "admin_manual",
        assignedBy: actingUserId ?? userId,
      });

      toast.success("Marketing tag created and assigned successfully");
      setIsDialogOpen(false);
      setCreateNewTagMode(false);
      setNewTagData({
        name: "",
        description: "",
        category: "",
        color: "#3b82f6",
      });
    } catch (error) {
      toast.error("Failed to create and assign marketing tag");
      console.error("Error creating and assigning tag:", error);
    }
  };

  const handleAssignTag = async () => {
    if (createNewTagMode) {
      return handleCreateAndAssignTag();
    }

    if (!selectedTagId) {
      toast.error("Please select a tag to assign");
      return;
    }

    try {
      await assignTag({
        userId,
        tagId: selectedTagId as Id<"marketingTags">,
        source: "admin_manual",
        assignedBy: actingUserId ?? userId,
      });

      toast.success("Marketing tag assigned successfully");
      setIsDialogOpen(false);
      setSelectedTagId("");
    } catch (error) {
      toast.error("Failed to assign marketing tag");
      console.error("Error assigning tag:", error);
    }
  };

  const resetDialog = () => {
    setCreateNewTagMode(false);
    setSelectedTagId("");
    setNewTagData({
      name: "",
      description: "",
      category: "",
      color: "#3b82f6",
    });
  };

  const handleRemoveTag = async (userTag: {
    _id: Id<"userMarketingTags">;
    marketingTag: { _id: Id<"marketingTags"> };
  }) => {
    try {
      await removeTag({
        userId,
        tagId: userTag.marketingTag._id,
      });

      toast.success("Marketing tag removed successfully");
    } catch (error) {
      toast.error("Failed to remove marketing tag");
      console.error("Error removing tag:", error);
    }
  };

  // This function is no longer needed since userTags now includes tag details
  // const getTagById = (tagId: Id<"marketingTags">) => {
  //   return marketingTags?.find((tag) => tag._id === tagId);
  // };

  const getTagColor = (color?: string) => {
    if (!color) return "bg-gray-500";
    if (color.startsWith("#")) return color;
    return `bg-${color}-500`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Marketing Tags
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" />
                Add Tag
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {createNewTagMode
                    ? "Create New Marketing Tag"
                    : "Assign Marketing Tag"}
                </DialogTitle>
                <DialogDescription>
                  {createNewTagMode
                    ? "Create a new marketing tag and assign it to this user."
                    : "Select an existing marketing tag to assign to this user, or create a new one."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {!createNewTagMode ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="tag-select">Marketing Tag</Label>
                      <Select
                        value={selectedTagId}
                        onValueChange={setSelectedTagId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a marketing tag..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTags.map((tag) => (
                            <SelectItem key={tag._id} value={tag._id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-3 w-3 rounded-full`}
                                  style={{
                                    backgroundColor: tag.color ?? "#6b7280",
                                  }}
                                />
                                <span>{tag.name}</span>
                                {tag.category && (
                                  <span className="text-xs text-muted-foreground">
                                    ({tag.category})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => setCreateNewTagMode(true)}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Tag Instead
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="new-tag-name">Tag Name *</Label>
                      <Input
                        id="new-tag-name"
                        placeholder="e.g. Premium Customer"
                        value={newTagData.name}
                        onChange={(e) =>
                          setNewTagData({ ...newTagData, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="new-tag-description">Description</Label>
                      <Textarea
                        id="new-tag-description"
                        placeholder="Optional description for this tag..."
                        value={newTagData.description}
                        onChange={(e) =>
                          setNewTagData({
                            ...newTagData,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="new-tag-category">Category</Label>
                      <Select
                        value={newTagData.category}
                        onValueChange={(value) =>
                          setNewTagData({ ...newTagData, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PREDEFINED_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Color</Label>
                      <div className="flex flex-wrap gap-2">
                        {PREDEFINED_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`h-6 w-6 rounded-full border-2 ${
                              newTagData.color === color
                                ? "border-foreground"
                                : "border-transparent"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() =>
                              setNewTagData({ ...newTagData, color })
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => setCreateNewTagMode(false)}
                        className="w-full"
                      >
                        Back to Existing Tags
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetDialog();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignTag}
                  disabled={
                    createNewTagMode ? !newTagData.name.trim() : !selectedTagId
                  }
                >
                  {createNewTagMode ? "Create & Assign" : "Assign Tag"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!userTags || userTags.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Tag className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>No marketing tags assigned</p>
            <p className="text-sm">
              Add tags to help with user segmentation and marketing automation.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {userTags.map((userTag) => {
              const tag = userTag.marketingTag;

              return (
                <div
                  key={userTag._id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: tag.color ?? "#6b7280" }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tag.name}</span>
                        {tag.category && (
                          <Badge variant="secondary" className="text-xs">
                            {tag.category}
                          </Badge>
                        )}
                      </div>
                      {tag.description && (
                        <p className="text-sm text-muted-foreground">
                          {tag.description}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Source: {userTag.source ?? "admin_manual"}</span>
                        <span>•</span>
                        <span>
                          Assigned:{" "}
                          {new Date(userTag.assignedAt).toLocaleDateString()}
                        </span>
                        {userTag.expiresAt && (
                          <>
                            <span>•</span>
                            <span>
                              Expires:{" "}
                              {new Date(userTag.expiresAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTag(userTag)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {availableTags.length === 0 && userTags && userTags.length > 0 && (
          <div className="mt-4 rounded-lg border bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              All available marketing tags have been assigned to this user.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
