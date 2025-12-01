"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Search, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { ScrollArea } from "@acme/ui/scroll-area";
import { Separator } from "@acme/ui/separator";

import type { Id } from "../lib/types";
import {
  useSocialFeedApi,
  useSocialFeedAuth,
  useSocialFeedMutation,
} from "../context/SocialFeedClientProvider";

export interface BlockedUsersListProps {
  className?: string;
}

interface BlockedUser {
  id: Id<"users">;
  name: string;
  image?: string;
  blockLevel: "soft" | "full" | "report";
  blockedAt: number;
}

// Mock data for demonstration
const MOCK_BLOCKED_USERS: BlockedUser[] = [
  {
    id: "user1" as Id<"users">,
    name: "John Smith",
    image: "/avatars/01.png",
    blockLevel: "full",
    blockedAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
  },
  {
    id: "user2" as Id<"users">,
    name: "Alice Johnson",
    image: "/avatars/02.png",
    blockLevel: "soft",
    blockedAt: Date.now() - 1000 * 60 * 60 * 24 * 10, // 10 days ago
  },
  {
    id: "user3" as Id<"users">,
    name: "Bob Williams",
    blockLevel: "report",
    blockedAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
  },
];

export function BlockedUsersList({ className = "" }: BlockedUsersListProps) {
  const { userId } = useSocialFeedAuth();
  const socialfeedApi = useSocialFeedApi();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<BlockedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null);

  // TODO: Replace with actual user unblock mutation when available
  // Currently a placeholder
  const unblockUser = useSocialFeedMutation(
    socialfeedApi.mutations?.addComment,
  );

  // Load blocked users
  useEffect(() => {
    const loadBlockedUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // In a real app, fetch from API
        // const result = await convex.query(api.core.users.getBlockedUsers, { userId });

        // For now, use mock data
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setBlockedUsers(MOCK_BLOCKED_USERS);
        setFilteredUsers(MOCK_BLOCKED_USERS);
      } catch (err) {
        console.error("Error loading blocked users:", err);
        setError("Failed to load your blocked users list");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadBlockedUsers();
    }
  }, [userId]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(blockedUsers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = blockedUsers.filter((user) =>
      user.name.toLowerCase().includes(query),
    );

    setFilteredUsers(filtered);
  }, [searchQuery, blockedUsers]);

  // Handle unblock
  const handleUnblock = async () => {
    if (!userId || !selectedUser) return;

    try {
      // In a real implementation, this would call a dedicated API
      // This is just a placeholder
      await unblockUser({
        userId: userId as Id<"users">,
        feedItemId: "placeholder" as Id<"feedItems">,
        content: `UNBLOCK_USER: ${selectedUser.id}`,
      });

      // Update local state
      setBlockedUsers((prev) =>
        prev.filter((user) => user.id !== selectedUser.id),
      );
      setFilteredUsers((prev) =>
        prev.filter((user) => user.id !== selectedUser.id),
      );

      // Close dialog
      setUnblockDialogOpen(false);
      setSelectedUser(null);

      toast.success(`${selectedUser.name} has been unblocked`);
    } catch (err) {
      console.error("Error unblocking user:", err);
      toast.error("Failed to unblock user");
    }
  };

  // Format timestamp
  const formatBlockTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    // Less than a day
    if (diff < 1000 * 60 * 60 * 24) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }

    // Less than a month
    if (diff < 1000 * 60 * 60 * 24 * 30) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    }

    // Format as date
    return new Date(timestamp).toLocaleDateString();
  };

  // Get text describing block level
  const getBlockLevelText = (level: BlockedUser["blockLevel"]) => {
    switch (level) {
      case "full":
        return "Fully blocked";
      case "soft":
        return "Limited interactions";
      case "report":
        return "Reported and blocked";
      default:
        return "Blocked";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserX className="h-5 w-5" />
          Blocked Users
        </CardTitle>
        <CardDescription>
          Manage the users you&apos;ve blocked from interacting with you
        </CardDescription>
      </CardHeader>

      {error && (
        <CardContent className="pb-0">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      )}

      <CardContent>
        <div className="relative mb-4">
          <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
          <Input
            placeholder="Search blocked users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="text-center">
              <div className="border-primary mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"></div>
              <p className="text-muted-foreground text-sm">
                Loading blocked users...
              </p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-md border p-6 text-center">
            <h3 className="mb-2 text-lg font-medium">No Blocked Users</h3>
            {searchQuery ? (
              <p className="text-muted-foreground text-sm">
                No users matching &quot;{searchQuery}&quot; found.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                You haven&apos;t blocked any users yet.
              </p>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-start justify-between rounded-md border p-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback>
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{user.name}</h4>
                      <div className="flex flex-col gap-1">
                        <p className="text-muted-foreground text-xs">
                          {getBlockLevelText(user.blockLevel)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Blocked {formatBlockTime(user.blockedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setUnblockDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Unblock</span>
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Unblock confirmation dialog */}
      <Dialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unblock User</DialogTitle>
            <DialogDescription>
              Are you sure you want to unblock {selectedUser?.name}? They will
              be able to interact with your content again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnblockDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUnblock}>Unblock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
