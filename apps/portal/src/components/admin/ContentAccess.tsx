import React, { useEffect, useState } from "react";
import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Plus, X } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { toast } from "@acme/ui/toast";

export interface AccessRule {
  requiredTags: {
    mode: "all" | "some";
    tagIds: Id<"marketingTags">[];
  };
  excludedTags: {
    mode: "all" | "some";
    tagIds: Id<"marketingTags">[];
  };
  isPublic: boolean;
}

interface ContentAccessProps {
  contentType: "course" | "lesson" | "topic" | "download" | "product" | "quiz";
  contentId: string;
  title?: string;
}

export const ContentAccess: React.FC<ContentAccessProps> = ({
  contentType,
  contentId,
  title,
}) => {
  // State for access rules
  const [accessRules, setAccessRules] = useState<AccessRule>({
    requiredTags: { mode: "some", tagIds: [] },
    excludedTags: { mode: "some", tagIds: [] },
    isPublic: false,
  });

  // Queries
  // TODO: Restore marketing tags functionality after users refactor
  // const marketingTags = useQuery(
  //   api.core.users.marketingTags.index.listMarketingTags,
  // );
  const marketingTags = undefined;
  const currentRules = useQuery(
    api.lms.contentAccess.queries.getContentAccessRules,
    {
      contentType,
      contentId,
    },
  );

  const saveRules = useMutation(
    api.lms.contentAccess.mutations.saveContentAccessRules,
  );
  const clearRules = useMutation(
    api.lms.contentAccess.mutations.clearContentAccessRules,
  );

  // Load existing rules when data is available
  useEffect(() => {
    if (currentRules) {
      setAccessRules({
        requiredTags: currentRules.requiredTags,
        excludedTags: currentRules.excludedTags,
        isPublic: currentRules.isPublic ?? false,
      });
    }
  }, [currentRules]);

  const handleSave = async () => {
    try {
      await saveRules({
        contentType,
        contentId,
        requiredTags: accessRules.requiredTags,
        excludedTags: accessRules.excludedTags,
        isPublic: accessRules.isPublic,
      });
      toast.success("Access rules saved successfully");
    } catch (error) {
      console.error("Failed to save access rules:", error);
      toast.error("Failed to save access rules");
    }
  };

  const handleClear = async () => {
    try {
      await clearRules({ contentType, contentId });
      setAccessRules({
        requiredTags: { mode: "some", tagIds: [] },
        excludedTags: { mode: "some", tagIds: [] },
        isPublic: false,
      });
      toast.success("Access rules cleared");
    } catch (error) {
      console.error("Failed to clear access rules:", error);
      toast.error("Failed to clear access rules");
    }
  };

  const addRequiredTag = (tagId: Id<"marketingTags">) => {
    if (!accessRules.requiredTags.tagIds.includes(tagId)) {
      setAccessRules((prev) => ({
        ...prev,
        requiredTags: {
          ...prev.requiredTags,
          tagIds: [...prev.requiredTags.tagIds, tagId],
        },
      }));
    }
  };

  const removeRequiredTag = (tagId: Id<"marketingTags">) => {
    setAccessRules((prev) => ({
      ...prev,
      requiredTags: {
        ...prev.requiredTags,
        tagIds: prev.requiredTags.tagIds.filter((id) => id !== tagId),
      },
    }));
  };

  const addExcludedTag = (tagId: Id<"marketingTags">) => {
    if (!accessRules.excludedTags.tagIds.includes(tagId)) {
      setAccessRules((prev) => ({
        ...prev,
        excludedTags: {
          ...prev.excludedTags,
          tagIds: [...prev.excludedTags.tagIds, tagId],
        },
      }));
    }
  };

  const removeExcludedTag = (tagId: Id<"marketingTags">) => {
    setAccessRules((prev) => ({
      ...prev,
      excludedTags: {
        ...prev.excludedTags,
        tagIds: prev.excludedTags.tagIds.filter((id) => id !== tagId),
      },
    }));
  };

  const getTagName = (tagId: Id<"marketingTags">) => {
    return marketingTags?.find((tag) => tag._id === tagId)?.name ?? tagId;
  };

  const availableTags =
    marketingTags?.filter(
      (tag) =>
        !accessRules.requiredTags.tagIds.includes(tag._id) &&
        !accessRules.excludedTags.tagIds.includes(tag._id),
    ) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Access Control</CardTitle>
        <CardDescription>
          Configure who can access this {contentType}
          {title && ` (${title})`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Public Access Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isPublic"
            checked={accessRules.isPublic}
            onCheckedChange={(checked) =>
              setAccessRules((prev) => ({
                ...prev,
                isPublic: checked as boolean,
              }))
            }
          />
          <Label htmlFor="isPublic" className="text-sm font-medium">
            Publicly Accessible
          </Label>
        </div>

        {accessRules.isPublic && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-800">
              This content is publicly accessible to all users. Tag-based
              restrictions are disabled.
            </p>
          </div>
        )}

        {/* Tag-based access controls - disabled when public */}
        <div
          className={`space-y-6 ${accessRules.isPublic ? "pointer-events-none opacity-50" : ""}`}
        >
          {/* Required Tags Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Required Tags</Label>
              <Select
                value={accessRules.requiredTags.mode}
                onValueChange={(value: "all" | "some") =>
                  setAccessRules((prev) => ({
                    ...prev,
                    requiredTags: { ...prev.requiredTags, mode: value },
                  }))
                }
                disabled={accessRules.isPublic}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="some">Some</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              {accessRules.requiredTags.tagIds.map((tagId) => (
                <Badge
                  key={tagId}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {getTagName(tagId)}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeRequiredTag(tagId)}
                  />
                </Badge>
              ))}
            </div>

            <Select
              onValueChange={addRequiredTag}
              disabled={accessRules.isPublic}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add required tag..." />
              </SelectTrigger>
              <SelectContent>
                {availableTags.map((tag) => (
                  <SelectItem key={tag._id} value={tag._id}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Excluded Tags Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Excluded Tags</Label>
              <Select
                value={accessRules.excludedTags.mode}
                onValueChange={(value: "all" | "some") =>
                  setAccessRules((prev) => ({
                    ...prev,
                    excludedTags: { ...prev.excludedTags, mode: value },
                  }))
                }
                disabled={accessRules.isPublic}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="some">Some</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              {accessRules.excludedTags.tagIds.map((tagId) => (
                <Badge
                  key={tagId}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {getTagName(tagId)}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeExcludedTag(tagId)}
                  />
                </Badge>
              ))}
            </div>

            <Select
              onValueChange={addExcludedTag}
              disabled={accessRules.isPublic}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add excluded tag..." />
              </SelectTrigger>
              <SelectContent>
                {availableTags.map((tag) => (
                  <SelectItem key={tag._id} value={tag._id}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleSave}>Save Access Rules</Button>
          <Button variant="outline" onClick={handleClear}>
            Clear Rules
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
