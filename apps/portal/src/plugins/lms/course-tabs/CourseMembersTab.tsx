"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle, UserPlus } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { toast } from "@acme/ui/toast";

import type { PluginSingleViewComponentProps } from "~/lib/plugins/types";

const MOCK_MEMBERS = [
  { id: "1", name: "Alex Carter", email: "alex@example.com", status: "Active" },
  {
    id: "2",
    name: "Jamie Patel",
    email: "jamie@example.com",
    status: "Invited",
  },
  {
    id: "3",
    name: "Morgan Chen",
    email: "morgan@example.com",
    status: "Completed",
  },
] as const;

export function CourseMembersTab({
  pluginName,
}: PluginSingleViewComponentProps) {
  const [isInviting, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const members = useMemo(() => MOCK_MEMBERS, []);

  const handleInvite = () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success(`Invite pending`, {
        description: `Sent via ${pluginName}. Replace with real enrollment API.`,
      });
      setEmail("");
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enroll learners</CardTitle>
          <CardDescription>
            Invite members manually or sync them via an automation later.
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
            disabled={isInviting || !email.trim()}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {isInviting ? "Inviting…" : "Send invite"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current members</CardTitle>
          <CardDescription>
            Replace this table with live enrollment data once APIs are wired up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.status === "Active"
                          ? "default"
                          : member.status === "Completed"
                            ? "secondary"
                            : "outline"
                      }
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      {member.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
