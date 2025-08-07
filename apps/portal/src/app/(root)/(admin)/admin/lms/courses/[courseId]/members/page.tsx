"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import { useParams } from "next/navigation";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@acme/ui/command";
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";

export default function CourseMembersPage() {
  const params = useParams();
  const courseIdParam = params.courseId as string | undefined;
  // Cast to Convex Id type when available
  const courseId = courseIdParam as unknown as Id<"courses"> | undefined;

  const members = useQuery(
    api.lms.courses.queries.listCourseMembers,
    courseId ? { courseId } : "skip",
  );

  // Get current user info first
  const me = useQuery(api.users.queries.getMe);

  const isMeAdmin = me?.role === "admin";

  // Fetch all users only if admin
  const allUsers = useQuery(
    api.users.queries.listUsers,
    isMeAdmin ? {} : "skip",
  );

  // Mutations
  const addMember = useMutation(
    api.lms.enrollments.mutations.addMemberToCourse,
  );
  const removeMember = useMutation(
    api.lms.enrollments.mutations.removeMemberFromCourse,
  );

  if (members === undefined) return <div>Loading members...</div>;

  const availableUsers = allUsers
    ? allUsers.filter((u) => !members.some((m) => m._id === u._id))
    : [];

  if (!isMeAdmin) {
    return <div className="text-sm text-muted-foreground">Access denied.</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No members enrolled.
            </p>
          )}
          {members.length > 0 && (
            <ul className="divide-y">
              {members.map((member) => (
                <li
                  key={member._id}
                  className="group flex items-center justify-between py-3"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {member.name?.charAt(0) ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {member.name ?? "Unnamed"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.email ?? "No email"}
                      </p>
                    </div>
                  </div>
                  <div className="invisible group-hover:visible">
                    <ConfirmationDialog
                      triggerButtonClassName="p-1 h-auto"
                      triggerButtonVariant="ghost"
                      triggerButtonIcon={
                        <Trash2 className="h-4 w-4 text-destructive" />
                      }
                      title="Remove member?"
                      description="This will unenroll the user from the course."
                      onConfirm={async () => {
                        try {
                          if (!courseId) return;
                          await removeMember({
                            courseId,
                            userId: member._id,
                          });
                          toast.success("Member removed");
                        } catch (error) {
                          console.error("Failed to remove member", error);
                          toast.error("Failed to remove member");
                        }
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Add Member Section */}
          <Separator className="my-6" />
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Add Member</h3>
            {allUsers === undefined && <p>Loading users...</p>}
            {allUsers && availableUsers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                All users already enrolled.
              </p>
            )}
            {availableUsers.length > 0 && (
              <Command className="h-44 rounded-lg border shadow-sm">
                <CommandInput
                  placeholder="Search users..."
                  className="border-none"
                />
                <CommandList>
                  <CommandEmpty>No user found.</CommandEmpty>
                  <CommandGroup>
                    {availableUsers.map((user) => (
                      <CommandItem
                        key={user._id}
                        value={user.name ?? user.email ?? user._id}
                        onSelect={async () => {
                          try {
                            if (!courseId) return;
                            await addMember({
                              courseId,
                              userId: user._id,
                            });
                            toast.success("Member added!");
                          } catch (error) {
                            console.error("Failed to add member", error);
                            toast.error("Failed to add member");
                          }
                        }}
                      >
                        <div className="flex flex-col">
                          <span>{user.name ?? "Unnamed"}</span>
                          <span className="text-xs text-muted-foreground">
                            {user.email ?? "No email"}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
