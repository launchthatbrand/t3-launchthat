"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle, UserPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { useMemo, useState, useTransition } from "react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import type { PluginSingleViewComponentProps } from "launchthat-plugin-core";
import { toast } from "sonner";

type CourseMemberRow = {
  userId: string;
  status: "active" | "revoked" | string;
  source?: string;
  updatedAt?: number;
  user?: { name?: string; email?: string } | null;
};

export const CourseMembersTab = ({
  postId,
  organizationId,
  pluginName,
}: PluginSingleViewComponentProps) => {
  const [isInviting, startTransition] = useTransition();
  const [email, setEmail] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiAny = api as any;

  const normalizedOrgId =
    typeof organizationId === "string" && organizationId.trim().length > 0
      ? organizationId.trim()
      : null;

  const courseId = typeof postId === "string" ? postId : null;

  const membersRaw = useQuery(
    apiAny.plugins.lms.enrollments.queries.listCourseMembers,
    courseId ? { courseId } : "skip",
  ) as CourseMemberRow[] | undefined;

  const members = useMemo(() => {
    return Array.isArray(membersRaw) ? membersRaw : [];
  }, [membersRaw]);

  const enrollUserByEmail = useMutation(
    apiAny.plugins.lms.enrollments.mutations.enrollUserByEmail,
  ) as (args: {
    organizationId?: string;
    courseId: string;
    email: string;
  }) => Promise<string | null>;

  const revokeEnrollment = useMutation(
    apiAny.plugins.lms.enrollments.mutations.revokeEnrollment,
  ) as (args: { courseId: string; userId: string }) => Promise<null>;

  const handleInvite = () => {
    if (!courseId) {
      toast.error("Save this course first");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    startTransition(async () => {
      try {
        const userId = await enrollUserByEmail({
          organizationId: normalizedOrgId ?? undefined,
          courseId,
          email,
        });
        if (!userId) {
          toast.error("User not found", {
            description:
              "No core user exists with that email address. Ask them to sign up first.",
          });
          return;
        }
        toast.success("Enrolled", {
          description: `Enrollment created via ${pluginName}.`,
        });
        setEmail("");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Enrollment failed";
        toast.error("Enrollment failed", { description: message });
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enroll learners</CardTitle>
          <CardDescription>
            Manually enroll a user by email. (Enrollment is based on the core user
            account.)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1 space-y-2">
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="learner@example.com"
            />
          </div>
          <Button
            className="mt-6"
            onClick={handleInvite}
            disabled={isInviting || !email.trim() || !courseId}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {isInviting ? "Enrolling…" : "Enroll"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current members</CardTitle>
          <CardDescription>
            Live enrollments for this course.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No enrollments yet.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell className="font-medium">
                      {member.user?.name ?? "—"}
                    </TableCell>
                    <TableCell>{member.user?.email ?? "—"}</TableCell>
                    <TableCell>
                    <Badge
                      variant={
                        member.status === "active"
                          ? "default"
                          : member.status === "revoked"
                            ? "secondary"
                            : "outline"
                      }
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      {member.status === "active"
                        ? "Active"
                        : member.status === "revoked"
                          ? "Revoked"
                          : member.status}
                    </Badge>
                  </TableCell>
                    <TableCell>{member.source ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isInviting || member.status !== "active"}
                        onClick={() => {
                          if (!courseId) return;
                          startTransition(async () => {
                            try {
                              await revokeEnrollment({
                                courseId,
                                userId: member.userId,
                              });
                              toast.success("Enrollment revoked");
                            } catch (err) {
                              const message =
                                err instanceof Error
                                  ? err.message
                                  : "Revoke failed";
                              toast.error("Revoke failed", {
                                description: message,
                              });
                            }
                          });
                        }}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

