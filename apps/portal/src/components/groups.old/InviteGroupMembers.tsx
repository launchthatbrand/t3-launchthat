"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { SearchIcon, UserPlus } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import type { Id } from "../../../convex/_generated/dataModel";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Skeleton } from "@acme/ui/skeleton";
import { Textarea } from "@acme/ui/textarea";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { useState } from "react";

interface UserResult {
  _id: Id<"users">;
  name?: string;
  email: string;
  avatar?: string;
  isSelected: boolean;
}

interface InviteGroupMembersProps {
  groupId: Id<"groups">;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function InviteGroupMembers({
  groupId,
  trigger,
  onSuccess,
}: InviteGroupMembersProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Mutation to invite users
  const inviteUsersMutation = useMutation(api.groups.inviteToGroup);

  // Mock function to search users - this simulates searching by generating mock results
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setUserResults([]);
      return;
    }

    setIsSearching(true);

    // Simulate API call delay
    setTimeout(() => {
      // Generate mock search results based on the query
      // In a real implementation, you would call the API endpoint
      const mockUsers: UserResult[] = [
        {
          _id: "users:123" as Id<"users">,
          name: `John ${query}`,
          email: `john.${query.toLowerCase()}@example.com`,
          avatar: "",
          isSelected: selectedUsers.includes("users:123" as Id<"users">),
        },
        {
          _id: "users:456" as Id<"users">,
          name: `Jane ${query}`,
          email: `jane.${query.toLowerCase()}@example.com`,
          avatar: "",
          isSelected: selectedUsers.includes("users:456" as Id<"users">),
        },
        {
          _id: "users:789" as Id<"users">,
          name: `Sam ${query}`,
          email: `sam.${query.toLowerCase()}@example.com`,
          avatar: "",
          isSelected: selectedUsers.includes("users:789" as Id<"users">),
        },
      ];

      setUserResults(mockUsers);
      setIsSearching(false);
    }, 500);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    void handleSearch(query);
  };

  // Handle user selection
  const handleSelectUser = (userId: Id<"users">) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });

    // Also update the selected state in the user results
    setUserResults((prev) =>
      prev.map((user) => ({
        ...user,
        isSelected: user._id === userId ? !user.isSelected : user.isSelected,
      })),
    );
  };

  // Handle invitation submission
  const handleInvite = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user to invite");
      return;
    }

    setIsLoading(true);

    try {
      const results = await inviteUsersMutation({
        groupId,
        userIds: selectedUsers,
        message: message.trim() || undefined,
      });

      // Show success message
      const successCount = results.filter(
        (result) => result.status === "success",
      ).length;

      if (successCount > 0) {
        toast.success(
          `Successfully sent ${successCount} invitation${
            successCount !== 1 ? "s" : ""
          }`,
        );

        // Reset form and close dialog
        setSelectedUsers([]);
        setMessage("");
        setSearchQuery("");
        setOpen(false);

        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(
          "All selected users are either already members or have pending invitations",
        );
      }
    } catch (error) {
      console.error("Failed to send invitations:", error);
      toast.error(
        "Failed to send invitations. Please check your permissions and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const customTrigger = trigger ? (
    <DialogTrigger asChild>{trigger}</DialogTrigger>
  ) : (
    <DialogTrigger asChild>
      <Button variant="outline">
        <UserPlus className="mr-2 h-4 w-4" />
        Invite Members
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {customTrigger}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Search for users to invite to your group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email"
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <div className="max-h-60 overflow-y-auto rounded border p-1">
            {isSearching && <UserSearchSkeleton count={3} />}

            {!isSearching && userResults.length === 0 && searchQuery && (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                No users found. Try a different search term.
              </div>
            )}

            {!isSearching && userResults.length === 0 && !searchQuery && (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                Start typing to search for users.
              </div>
            )}

            {userResults.map((user) => (
              <div
                key={user._id}
                className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-accent"
                onClick={() => handleSelectUser(user._id)}
              >
                <Checkbox
                  checked={user.isSelected}
                  onCheckedChange={() => handleSelectUser(user._id)}
                  id={`user-${user._id}`}
                />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    {user.name?.[0] ?? user.email[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {user.name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="message">Invitation Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to your invitation"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedUsers.length} user{selectedUsers.length !== 1 ? "s" : ""}{" "}
            selected
          </div>
          <Button
            type="submit"
            onClick={handleInvite}
            disabled={selectedUsers.length === 0 || isLoading}
          >
            {isLoading ? "Sending..." : "Send Invitations"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Loading skeleton for user search results
function UserSearchSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded p-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1 h-3 w-32" />
          </div>
        </div>
      ))}
    </>
  );
}
