"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { Eye, Filter, PlusCircle, UserPlus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";

import type { Id } from "../../../convex/_generated/dataModel";
// Import the new EntityList components
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
  FilterValue,
} from "~/components/shared/EntityList/types";
import { DetachableFilters } from "~/components/shared/EntityList/DetachableFilters";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import { api } from "../../../convex/_generated/api";

// Interface for a group from the API
interface GroupData {
  _id: Id<"groups">;
  _creationTime: number;
  name: string;
  description: string;
  privacy: "public" | "private" | "restricted";
  avatar?: string;
  coverImage?: string;
  memberCount: number;
  userMembership: {
    role: "admin" | "moderator" | "member";
    status: "invited" | "pending" | "active" | "blocked";
  } | null;
  categoryTags: string[] | undefined;
  settings: {
    allowMemberPosts: boolean;
    allowMemberInvites: boolean;
    showInDirectory: boolean;
  };
  isArchived: boolean;
  createdBy: Id<"users">;
}

export function GroupDirectory() {
  const router = useRouter();
  const [searchQuery, _setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<
    Record<string, FilterValue>
  >({});
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // Convert active filters to API filters
  const apiFilters = {
    privacy: activeFilters.privacy as
      | "public"
      | "private"
      | "restricted"
      | undefined,
    categoryTags: [],
  };

  // Safely use the Convex API
  const groupsQuery = useQuery(api.groups.index.listGroups, {
    filters: apiFilters,
    search: searchQuery,
    paginationOpts: {
      numItems: 20,
      cursor: null,
    },
  }) as unknown as
    | {
        groups: GroupData[];
        continueCursor?: string;
        isDone: boolean;
      }
    | undefined;

  const isLoading = groupsQuery === undefined;
  const groupList = groupsQuery?.groups ?? [];

  // Define columns for the EntityList
  const columns: ColumnDefinition<GroupData>[] = [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      sortable: true,
      cell: (group) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={group.avatar} alt={group.name} />
            <AvatarFallback>
              {group.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{group.name}</div>
            <div className="line-clamp-1 text-sm text-muted-foreground">
              {group.description}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "privacy",
      header: "Privacy",
      accessorKey: "privacy",
      sortable: true,
      cell: (group) => {
        const variant =
          group.privacy === "public"
            ? "default"
            : group.privacy === "restricted"
              ? "secondary"
              : "outline";
        return <Badge variant={variant}>{group.privacy}</Badge>;
      },
    },
    {
      id: "memberCount",
      header: "Members",
      accessorKey: "memberCount",
      sortable: true,
    },
    {
      id: "categories",
      header: "Categories",
      cell: (group) => {
        if (!group.categoryTags || group.categoryTags.length === 0) {
          return <span className="text-muted-foreground">None</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {group.categoryTags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
            {group.categoryTags.length > 2 && (
              <Badge variant="outline">+{group.categoryTags.length - 2}</Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "membership",
      header: "Status",
      cell: (group) => {
        if (!group.userMembership) {
          return <span className="text-muted-foreground">Not a member</span>;
        }
        return (
          <Badge>
            {group.userMembership.role.charAt(0).toUpperCase() +
              group.userMembership.role.slice(1)}
          </Badge>
        );
      },
    },
  ];

  // Define filter configurations
  const filters: FilterConfig<GroupData>[] = [
    {
      id: "privacy",
      label: "Privacy",
      type: "select",
      field: "privacy",
      options: [
        { label: "Public", value: "public" },
        { label: "Restricted", value: "restricted" },
        { label: "Private", value: "private" },
      ],
    },
    {
      id: "isMember",
      label: "Membership",
      type: "select",
      field: (group) => !!group.userMembership,
      options: [
        { label: "Member", value: true },
        { label: "Not a member", value: false },
      ],
    },
  ];

  // Define entity actions
  const entityActions: EntityAction<GroupData>[] = [
    {
      id: "view",
      label: "View",
      onClick: (group) => router.push(`/groups/${group._id}`),
      variant: "outline",
      icon: <Eye className="mr-2 h-4 w-4" />,
    },
    {
      id: "join",
      label: (group) => {
        if (!group.userMembership) {
          return "Join Group";
        }
        if (
          group.userMembership.role === "admin" ||
          group.userMembership.role === "moderator"
        ) {
          return "Manage Group";
        }
        return "Leave Groupss";
      },
      onClick: (group) => {
        if (group.userMembership) {
          router.push(`/groups/${group._id}`);
        } else {
          // Handle join functionality
          router.push(`/groups/${group._id}`);
        }
      },
      variant: "secondary",
      icon: <UserPlus className="mr-2 h-4 w-4" />,
    },
  ];

  // Handle filter changes
  const handleFilterChange = (newFilters: Record<string, FilterValue>) => {
    setActiveFilters(newFilters);
  };

  const navigateToCreateGroup = () => {
    router.push("/groups/create");
  };

  // Create filter button with popover
  const filterButton = (
    <Popover open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="ml-2">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {Object.keys(activeFilters).length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {Object.keys(activeFilters).length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <h4 className="font-medium">Filter Groups</h4>
          <DetachableFilters
            filters={filters}
            activeFilters={activeFilters}
            onFilterChange={(newFilters) => {
              handleFilterChange(newFilters);
              if (Object.keys(newFilters).length === 0) {
                setIsFilterMenuOpen(false);
              }
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-6">
      <EntityList<GroupData>
        data={groupList}
        columns={columns}
        filters={filters}
        hideFilters={true}
        initialFilters={activeFilters}
        onFiltersChange={handleFilterChange}
        isLoading={isLoading}
        title="Browse Groups"
        description="Find and join groups that match your interests"
        defaultViewMode="grid"
        viewModes={["list", "grid"]}
        entityActions={entityActions}
        actions={
          <div className="flex items-center gap-2">
            {filterButton}
            <Button onClick={navigateToCreateGroup}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </div>
        }
        emptyState={
          <div className="flex h-60 flex-col items-center justify-center space-y-4">
            <p className="text-center text-muted-foreground">
              No groups found. Create a new group to get started!
            </p>
            <Button onClick={navigateToCreateGroup} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </div>
        }
      />
    </div>
  );
}
