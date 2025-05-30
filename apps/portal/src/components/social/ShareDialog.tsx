"use client";

import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";

import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useContentSharing } from "../../hooks/useContentSharing";
import { SharedContentCard } from "./SharedContentCard";

export interface ContentToShare {
  id: string;
  type: "feedItem" | "blog" | "course" | "product" | "event" | "group";
  title?: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  price?: string;
  date?: string;
  location?: string;
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentToShare;
}

export function ShareDialog({ isOpen, onClose, content }: ShareDialogProps) {
  const { userId } = useAuth();
  const [comment, setComment] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "group">(
    "public",
  );
  const [activeTab, setActiveTab] = useState<"share" | "groups" | "message">(
    "share",
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [directMessageTo, setDirectMessageTo] = useState<string>("");
  const [messageText, setMessageText] = useState<string>("");

  // Use our custom hook for sharing functionality
  const { isSharing, shareToFeed, shareToGroup, shareToUser } =
    useContentSharing({
      onShareSuccess: () => {
        // Reset form and close dialog on success
        setComment("");
        setMessageText("");
        onClose();
      },
    });

  // Fetch content details if it's a feed item
  const feedItem = useQuery(
    api.socialfeed.queries.getFeedItem,
    content.type === "feedItem"
      ? { feedItemId: content.id as Id<"feedItems"> }
      : "skip",
  );

  // Handle form submission for Feed sharing
  const handleShareToFeed = async () => {
    if (!userId) return;
    await shareToFeed(userId, content, comment, visibility);
  };

  // Handle form submission for Group sharing
  const handleShareToGroup = async () => {
    if (!userId || !selectedGroupId) return;
    await shareToGroup(userId, selectedGroupId, content, comment);
  };

  // Handle form submission for Direct Message
  const handleSendDirectMessage = async () => {
    if (!userId || !directMessageTo) return;
    await shareToUser(userId, directMessageTo, content, messageText);
  };

  // Get the appropriate handler based on active tab
  const getSubmitHandler = () => {
    switch (activeTab) {
      case "share":
        return handleShareToFeed;
      case "groups":
        return handleShareToGroup;
      case "message":
        return handleSendDirectMessage;
      default:
        return handleShareToFeed;
    }
  };

  // Check if form is valid based on active tab
  const isFormValid = () => {
    switch (activeTab) {
      case "share":
        return true; // Comment is optional for sharing to feed
      case "groups":
        return !!selectedGroupId;
      case "message":
        return !!directMessageTo && !!messageText;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Content</DialogTitle>
          <DialogDescription>
            Share this content to your feed with optional commentary.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="share"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="share">Share to Feed</TabsTrigger>
            <TabsTrigger value="groups">Share to Group</TabsTrigger>
            <TabsTrigger value="message">Direct Message</TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-4 py-4">
            <div className="space-y-4">
              <Textarea
                placeholder="Add a comment about this content..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Visibility</label>
                <Select
                  value={visibility}
                  onValueChange={(value) =>
                    setVisibility(value as "public" | "private" | "group")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      Public - Everyone can see
                    </SelectItem>
                    <SelectItem value="private">
                      Private - Only you can see
                    </SelectItem>
                    <SelectItem value="group">
                      Group - Share to a specific group
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {visibility === "group" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Group</label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder">
                        Group functionality coming soon
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="rounded-md border p-3">
                <h4 className="mb-2 text-sm font-medium">Content Preview</h4>
                <SharedContentCard
                  content={content}
                  feedItem={feedItem}
                  isPreview
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="groups" className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Group</label>
                <Select
                  disabled
                  value={selectedGroupId}
                  onValueChange={setSelectedGroupId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo-group-1">Web Developers</SelectItem>
                    <SelectItem value="demo-group-2">
                      UI/UX Designers
                    </SelectItem>
                    <SelectItem value="demo-group-3">
                      Product Managers
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Group sharing functionality is coming soon.
                </p>
              </div>

              <Textarea
                placeholder="Add a message to the group..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
                disabled
              />

              <div className="rounded-md border p-3">
                <h4 className="mb-2 text-sm font-medium">Content Preview</h4>
                <SharedContentCard
                  content={content}
                  feedItem={feedItem}
                  isPreview
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="message" className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Send To</label>
                <Select
                  disabled
                  value={directMessageTo}
                  onValueChange={setDirectMessageTo}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user-1">John Doe</SelectItem>
                    <SelectItem value="user-2">Jane Smith</SelectItem>
                    <SelectItem value="user-3">Sam Wilson</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Direct messaging functionality is coming soon.
                </p>
              </div>

              <Textarea
                placeholder="Write your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="min-h-[100px]"
                disabled
              />

              <div className="rounded-md border p-3">
                <h4 className="mb-2 text-sm font-medium">Content Preview</h4>
                <SharedContentCard
                  content={content}
                  feedItem={feedItem}
                  isPreview
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={getSubmitHandler()}
            disabled={isSharing || !isFormValid() || activeTab !== "share"}
          >
            {isSharing ? "Sharing..." : "Share"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
