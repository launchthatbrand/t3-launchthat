"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
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

// Avoid importing the generated Convex `api` with full types in a client component.
// The generated api types are extremely deep and can trip TS' instantiation limit.
import * as apiAny from "@convex-config/_generated/api";

type MarketingTagRow = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  color?: string;
  isActive?: boolean;
};

type ContactTagAssignmentRow = {
  _id: string;
  contactId: string;
  marketingTag: MarketingTagRow;
};

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

export interface ContactMarketingTagsManagerProps {
  organizationId?: string | null;
  contactId: string;
  canEdit: boolean;
  variant?: "card" | "embedded";
}

export function ContactMarketingTagsManager({
  organizationId,
  contactId,
  canEdit,
  variant = "card",
}: ContactMarketingTagsManagerProps) {
  const orgId = typeof organizationId === "string" ? organizationId : undefined;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [createNewTagMode, setCreateNewTagMode] = useState(false);
  const [newTagData, setNewTagData] = useState({
    name: "",
    description: "",
    category: "",
    color: "#3b82f6",
  });

  const marketingTags = useQuery(
    apiAny.api.plugins.crm.marketingTags.queries.listMarketingTags,
    { organizationId: orgId },
  ) as unknown as MarketingTagRow[] | undefined;

  const contactTags = useQuery(
    apiAny.api.plugins.crm.marketingTags.queries.getContactMarketingTags,
    { organizationId: orgId, contactId },
  ) as unknown as ContactTagAssignmentRow[] | undefined;

  const createTagMutation = useMutation(
    apiAny.api.plugins.crm.marketingTags.mutations.createMarketingTag,
  ) as (args: any) => Promise<string>;

  const assignTagMutation = useMutation(
    apiAny.api.plugins.crm.marketingTags.mutations.assignMarketingTagToContact,
  ) as (args: any) => Promise<any>;

  const removeTagMutation = useMutation(
    apiAny.api.plugins.crm.marketingTags.mutations
      .removeMarketingTagFromContact,
  ) as (args: any) => Promise<any>;

  const availableTags = useMemo(() => {
    const all = Array.isArray(marketingTags) ? marketingTags : [];
    const current = Array.isArray(contactTags) ? contactTags : [];
    const owned = new Set(
      current.map((row) => row.marketingTag?._id).filter(Boolean),
    );
    return all.filter((tag) => !owned.has(tag._id));
  }, [marketingTags, contactTags]);

  const handleCreateAndAssignTag = async () => {
    if (!newTagData.name.trim()) {
      toast.error("Tag name is required");
      return;
    }

    try {
      const createdId = await createTagMutation({
        organizationId: orgId,
        name: newTagData.name.trim(),
        slug: newTagData.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        description: newTagData.description.trim() || undefined,
        color: newTagData.color,
        category: newTagData.category || undefined,
        isActive: true,
      });

      await assignTagMutation({
        organizationId: orgId,
        contactId,
        marketingTagId: createdId,
        source: "admin_manual",
      });

      toast.success("Marketing tag created and assigned");
      setIsDialogOpen(false);
      setCreateNewTagMode(false);
      setSelectedTagId("");
      setNewTagData({
        name: "",
        description: "",
        category: "",
        color: "#3b82f6",
      });
    } catch (error) {
      toast.error("Failed to create and assign marketing tag");
      console.error(error);
    }
  };

  const handleAssignTag = async () => {
    if (!selectedTagId) {
      toast.error("Please select a tag to assign");
      return;
    }

    try {
      await assignTagMutation({
        organizationId: orgId,
        contactId,
        marketingTagId: selectedTagId,
        source: "admin_manual",
      });
      toast.success("Marketing tag assigned");
      setIsDialogOpen(false);
      setSelectedTagId("");
    } catch (error) {
      toast.error("Failed to assign marketing tag");
      console.error(error);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await removeTagMutation({
        organizationId: orgId,
        contactId,
        marketingTagId: tagId,
      });
      toast.success("Marketing tag removed");
    } catch (error) {
      toast.error("Failed to remove marketing tag");
      console.error(error);
    }
  };

  const isLoading = marketingTags === undefined || contactTags === undefined;
  const currentTags = Array.isArray(contactTags) ? contactTags : [];

  const header = (
    <div className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <Tag className="h-5 w-5" />
        Marketing Tags
      </CardTitle>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={!canEdit || isLoading}>
            <Plus className="mr-1 h-4 w-4" />
            Add Tag
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {createNewTagMode
                ? "Create New Marketing Tag"
                : "Assign Marketing Tag"}
            </DialogTitle>
            <DialogDescription>
              {createNewTagMode
                ? "Create a new marketing tag and assign it to this contact."
                : "Select an existing marketing tag to assign to this contact, or create a new one."}
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
                    <SelectTrigger id="tag-select">
                      <SelectValue placeholder="Select a marketing tag..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTags.map((tag) => (
                        <SelectItem key={tag._id} value={tag._id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor: tag.color ?? "#6b7280",
                              }}
                            />
                            <span>{tag.name}</span>
                            {tag.category && (
                              <span className="text-muted-foreground text-xs">
                                ({tag.category})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCreateNewTagMode(true)}
                  >
                    Create new tag instead
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-tag-name">Name</Label>
                  <Input
                    id="new-tag-name"
                    value={newTagData.name}
                    onChange={(e) =>
                      setNewTagData((prev) => ({
                        ...prev,
                        name: e.currentTarget.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-tag-description">Description</Label>
                  <Textarea
                    id="new-tag-description"
                    value={newTagData.description}
                    onChange={(e) =>
                      setNewTagData((prev) => ({
                        ...prev,
                        description: e.currentTarget.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-tag-category">Category</Label>
                    <Select
                      value={newTagData.category}
                      onValueChange={(value) =>
                        setNewTagData((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger id="new-tag-category">
                        <SelectValue placeholder="Select category..." />
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

                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {PREDEFINED_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`h-6 w-6 rounded-full border ${
                            newTagData.color === color
                              ? "ring-2 ring-offset-2"
                              : ""
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() =>
                            setNewTagData((prev) => ({ ...prev, color }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCreateNewTagMode(false)}
                  >
                    Use existing tag instead
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setCreateNewTagMode(false);
                setSelectedTagId("");
                setNewTagData({
                  name: "",
                  description: "",
                  category: "",
                  color: "#3b82f6",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() =>
                createNewTagMode
                  ? handleCreateAndAssignTag()
                  : handleAssignTag()
              }
              disabled={!canEdit}
            >
              {createNewTagMode ? "Create + Assign" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const body = (
    <>
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading tags…</div>
      ) : currentTags.length === 0 ? (
        <div className="text-muted-foreground text-sm">
          No marketing tags assigned to this contact.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {currentTags.map((row) => (
            <Badge
              key={row._id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <span>{row.marketingTag?.name ?? "Unknown tag"}</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => handleRemoveTag(row.marketingTag._id)}
                disabled={!canEdit}
                aria-label="Remove marketing tag"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </>
  );

  if (variant === "embedded") {
    return (
      <div className="space-y-4">
        {header}
        {body}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>{header}</CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
