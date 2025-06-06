"use client";

import { useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Globe,
  Lock,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@acme/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Label } from "@acme/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import { RadioGroup, RadioGroupItem } from "@acme/ui/radio-group";
import { ScrollArea } from "@acme/ui/scroll-area";

import type { Id } from "../../../../convex/_generated/dataModel";

export type Visibility =
  | "public"
  | "followers"
  | "private"
  | "group"
  | "specific_users";
export type ModuleType = "blog" | "course" | "group" | "event";

export interface VisibilitySelectorProps {
  visibility: Visibility;
  onVisibilityChange: (visibility: Visibility) => void;
  moduleType?: ModuleType;
  moduleId?: string;
  onModuleChange?: (
    type: ModuleType | undefined,
    id: string | undefined,
  ) => void;
  specificUserIds?: Id<"users">[];
  onSpecificUsersChange?: (userIds: Id<"users">[]) => void;
}

// Mock data for user search - this would be replaced by a real API call
const MOCK_USERS = [
  { id: "user1" as Id<"users">, name: "Jane Cooper", image: "/avatars/01.png" },
  { id: "user2" as Id<"users">, name: "Robert Fox", image: "/avatars/02.png" },
  { id: "user3" as Id<"users">, name: "Cody Fisher", image: "/avatars/03.png" },
  {
    id: "user4" as Id<"users">,
    name: "Annette Black",
    image: "/avatars/04.png",
  },
  { id: "user5" as Id<"users">, name: "Wade Warren", image: "/avatars/05.png" },
  {
    id: "user6" as Id<"users">,
    name: "Bessie Cooper",
    image: "/avatars/06.png",
  },
  {
    id: "user7" as Id<"users">,
    name: "Cameron Williamson",
    image: "/avatars/07.png",
  },
];

// Mock data for groups - this would be replaced by a real API call
const MOCK_GROUPS = [
  { id: "group1", name: "Marketing Team", image: "/groups/01.png" },
  { id: "group2", name: "Engineering", image: "/groups/02.png" },
  { id: "group3", name: "Product Design", image: "/groups/03.png" },
  { id: "group4", name: "Customer Support", image: "/groups/04.png" },
];

export function VisibilitySelector({
  visibility,
  onVisibilityChange,
  moduleId,
  onModuleChange,
  specificUserIds = [],
  onSpecificUsersChange,
}: VisibilitySelectorProps) {
  const [open, setOpen] = useState(false);
  const [groupsDialogOpen, setGroupsDialogOpen] = useState(false);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] =
    useState<Id<"users">[]>(specificUserIds);

  // The currently selected group
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
    visibility === "group" ? moduleId : undefined,
  );

  // Get icon and label based on visibility
  const getVisibilityDetails = () => {
    switch (visibility) {
      case "public":
        return { icon: <Globe className="h-4 w-4" />, label: "Public" };
      case "followers":
        return {
          icon: <UserPlus className="h-4 w-4" />,
          label: "Followers only",
        };
      case "group":
        return { icon: <Users className="h-4 w-4" />, label: "Group members" };
      case "specific_users":
        return {
          icon: <Users className="h-4 w-4" />,
          label: `${selectedUsers.length} specific ${selectedUsers.length === 1 ? "user" : "users"}`,
        };
      case "private":
      default:
        return { icon: <Lock className="h-4 w-4" />, label: "Only me" };
    }
  };

  // Apply group selection
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    if (onModuleChange) {
      onModuleChange("group", groupId);
    }
    onVisibilityChange("group");
    setGroupsDialogOpen(false);
  };

  // Apply user selection
  const handleUsersConfirm = () => {
    if (onSpecificUsersChange) {
      onSpecificUsersChange(selectedUsers);
    }
    onVisibilityChange("specific_users");
    setUsersDialogOpen(false);
  };

  // Toggle user selection
  const toggleUserSelection = (userId: Id<"users">) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  // Handle visibility selection
  const handleVisibilitySelect = (newVisibility: Visibility) => {
    // If selecting group, open the group selector
    if (newVisibility === "group") {
      setGroupsDialogOpen(true);
      return;
    }

    // If selecting specific users, open the user selector
    if (newVisibility === "specific_users") {
      setUsersDialogOpen(true);
      return;
    }

    // Otherwise just update the visibility
    onVisibilityChange(newVisibility);
    setOpen(false);
  };

  const { icon, label } = getVisibilityDetails();

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 text-sm font-normal"
            size="sm"
          >
            {icon}
            <span>{label}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-0" align="start">
          <Command>
            <CommandGroup heading="Who can see this post?">
              <CommandItem
                onSelect={() => handleVisibilitySelect("public")}
                className="flex items-center gap-2 px-2 py-2.5"
              >
                <div className="flex-shrink-0">
                  <Globe className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span>Public</span>
                  <span className="text-xs text-muted-foreground">
                    Anyone can see this post
                  </span>
                </div>
                {visibility === "public" && (
                  <Check className="ml-auto h-4 w-4 text-primary" />
                )}
              </CommandItem>

              <CommandItem
                onSelect={() => handleVisibilitySelect("followers")}
                className="flex items-center gap-2 px-2 py-2.5"
              >
                <div className="flex-shrink-0">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span>Followers only</span>
                  <span className="text-xs text-muted-foreground">
                    Only your followers can see this
                  </span>
                </div>
                {visibility === "followers" && (
                  <Check className="ml-auto h-4 w-4 text-primary" />
                )}
              </CommandItem>

              <CommandItem
                onSelect={() => handleVisibilitySelect("group")}
                className="flex items-center gap-2 px-2 py-2.5"
              >
                <div className="flex-shrink-0">
                  <Users className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span>Group members</span>
                  <span className="text-xs text-muted-foreground">
                    Only members of a group can see this
                  </span>
                </div>
                {visibility === "group" && (
                  <Check className="ml-auto h-4 w-4 text-primary" />
                )}
              </CommandItem>

              <CommandItem
                onSelect={() => handleVisibilitySelect("specific_users")}
                className="flex items-center gap-2 px-2 py-2.5"
              >
                <div className="flex-shrink-0">
                  <Users className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span>Specific people</span>
                  <span className="text-xs text-muted-foreground">
                    Only people you select can see this
                  </span>
                </div>
                {visibility === "specific_users" && (
                  <Check className="ml-auto h-4 w-4 text-primary" />
                )}
              </CommandItem>

              <CommandItem
                onSelect={() => handleVisibilitySelect("private")}
                className="flex items-center gap-2 px-2 py-2.5"
              >
                <div className="flex-shrink-0">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span>Only me</span>
                  <span className="text-xs text-muted-foreground">
                    Only you can see this post
                  </span>
                </div>
                {visibility === "private" && (
                  <Check className="ml-auto h-4 w-4 text-primary" />
                )}
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Group selection dialog */}
      <Dialog open={groupsDialogOpen} onOpenChange={setGroupsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select a group</DialogTitle>
            <DialogDescription>
              Your post will only be visible to members of this group.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <RadioGroup
              value={selectedGroupId}
              onValueChange={setSelectedGroupId}
              className="space-y-2"
            >
              {MOCK_GROUPS.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center space-x-3 rounded-md border border-muted p-3"
                >
                  <RadioGroupItem value={group.id} id={`group-${group.id}`} />
                  <Label
                    htmlFor={`group-${group.id}`}
                    className="flex flex-1 items-center gap-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={group.image} alt={group.name} />
                      <AvatarFallback>
                        {group.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{group.name}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setGroupsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedGroupId && handleGroupSelect(selectedGroupId)
              }
              disabled={!selectedGroupId}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User selection dialog */}
      <Dialog open={usersDialogOpen} onOpenChange={setUsersDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select people</DialogTitle>
            <DialogDescription>
              Your post will only be visible to the people you select.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <Command className="rounded-lg border shadow-md">
              <CommandInput placeholder="Search people..." />
              <CommandEmpty>No people found.</CommandEmpty>
              <ScrollArea className="max-h-48">
                <CommandGroup>
                  {MOCK_USERS.map((user) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => toggleUserSelection(user.id)}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                          selectedUsers.includes(user.id)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted"
                        }`}
                      >
                        {selectedUsers.includes(user.id) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.image} alt={user.name} />
                        <AvatarFallback>
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </Command>

            {selectedUsers.length > 0 && (
              <div>
                <Label>Selected ({selectedUsers.length})</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedUsers.map((userId) => {
                    const user = MOCK_USERS.find((u) => u.id === userId);
                    if (!user) return null;

                    return (
                      <Badge
                        key={user.id}
                        variant="secondary"
                        className="gap-1"
                      >
                        {user.name}
                        <button
                          onClick={() => toggleUserSelection(user.id)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted"
                        >
                          <span className="sr-only">Remove</span>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setUsersDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUsersConfirm}
              disabled={selectedUsers.length === 0}
            >
              Confirm ({selectedUsers.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
