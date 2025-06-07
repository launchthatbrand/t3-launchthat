"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

interface GroupMembersProps {
  title?: string;
  groupId?: Id<"groups">;
  maxMembers?: number;
  showRoles?: boolean;
  variant?: "default" | "compact";
}

// Add a type that includes the image property
interface GroupMemberWithUser {
  _id: Id<"groupMembers">;
  role: string;
  joinedAt: number;
  status: string;
  user?: {
    _id: Id<"users">;
    name?: string;
    email: string;
    role: "admin" | "user";
    image?: string; // Add the image property
  };
}

export function GroupMembers({
  title = "Group Members",
  groupId,
  maxMembers = 5,
  showRoles = true,
  variant = "default",
}: GroupMembersProps) {
  // Skip the query if no groupId is provided
  const membersQuery = useQuery(
    api.groups.queries.getGroupMembers,
    groupId
      ? {
          groupId,
          paginationOpts: {
            numItems: maxMembers,
            cursor: null,
          },
        }
      : "skip",
  );

  const members = useMemo(() => {
    return (membersQuery?.members ?? []) as GroupMemberWithUser[];
  }, [membersQuery]);

  // If no members data is available yet, show a placeholder
  if (!members.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {groupId
            ? "No members found for this group."
            : "Please select a group in edit mode."}
        </CardContent>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            {members.map((member) => (
              <div key={member._id} className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  {member.user?.image && (
                    <AvatarImage
                      src={member.user.image}
                      alt={member.user.name ?? "Member"}
                    />
                  )}
                  <AvatarFallback>
                    {member.user?.name?.[0] ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {member.user?.name ?? member.user?.email ?? "Unknown User"}
                </span>
                {showRoles && member.role && (
                  <Badge
                    variant={member.role === "admin" ? "default" : "secondary"}
                    className="ml-auto text-xs"
                  >
                    {member.role}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant - instead of using EntityList, render members directly
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {members.length > 0 ? (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member._id}
                className="flex items-center space-x-3 rounded-md border p-3"
              >
                <Avatar>
                  {member.user?.image ? (
                    <AvatarImage
                      src={member.user.image}
                      alt={member.user.name ?? "Member"}
                    />
                  ) : (
                    <AvatarFallback>
                      {member.user?.name?.[0] ?? "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0 flex-grow">
                  <div className="font-medium">
                    {member.user?.name ?? "Unknown User"}
                  </div>
                  {member.user?.email && (
                    <div className="truncate text-sm text-muted-foreground">
                      {member.user.email}
                    </div>
                  )}
                </div>
                {showRoles && member.role && (
                  <Badge
                    variant={member.role === "admin" ? "default" : "secondary"}
                    className="ml-auto"
                  >
                    {member.role}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            No members to display
          </div>
        )}
      </CardContent>
    </Card>
  );
}
