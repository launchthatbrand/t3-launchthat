"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import type { CoreTenantOrganizationsUiApi, OrganizationMemberRow } from "./types";

export interface AvailableUserOption {
  userId: string;
  label: string;
  sublabel?: string;
}

export interface OrganizationMembersManagerProps {
  api: CoreTenantOrganizationsUiApi;
  organizationId: string;
  availableUsers: AvailableUserOption[];
  className?: string;
}

export const OrganizationMembersManager = (props: OrganizationMembersManagerProps) => {
  const { listMembersByOrganizationId } = props.api.launchthat_core_tenant.queries;
  const { ensureMembership, removeMembership } = props.api.launchthat_core_tenant.mutations;

  if (!listMembersByOrganizationId || !ensureMembership || !removeMembership) {
    return (
      <div className={props.className}>
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            This app’s API adapter is missing required member management functions.
          </CardContent>
        </Card>
      </div>
    );
  }

  const members = useQuery(listMembersByOrganizationId, {
    organizationId: props.organizationId,
  });

  const addMember = useMutation(ensureMembership);
  const removeMember = useMutation(removeMembership);

  const [selectedUserId, setSelectedUserId] = React.useState<string>("");
  const [busyKey, setBusyKey] = React.useState<string | null>(null);

  const available = props.availableUsers;

  const handleAdd = async () => {
    if (!selectedUserId) return;
    setBusyKey(`add:${selectedUserId}`);
    try {
      await addMember({
        userId: selectedUserId,
        organizationId: props.organizationId,
        role: "viewer",
      });
      setSelectedUserId("");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className={props.className}>
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-2">
              <Label>Add existing user</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user…" />
                </SelectTrigger>
                <SelectContent>
                  {available.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No users available
                    </SelectItem>
                  ) : (
                    available.map((u) => (
                      <SelectItem key={u.userId} value={u.userId}>
                        {u.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedUserId ? (
                <div className="text-muted-foreground text-xs">
                  {available.find((u) => u.userId === selectedUserId)?.sublabel ?? ""}
                </div>
              ) : null}
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                disabled={!selectedUserId || busyKey === `add:${selectedUserId}`}
                onClick={handleAdd}
              >
                {busyKey === `add:${selectedUserId}` ? "Adding…" : "Add"}
              </Button>
            </div>
          </div>

          <MembersTable
            members={Array.isArray(members) ? members : []}
            onRemove={async (row) => {
              setBusyKey(`rm:${row.userId}`);
              try {
                await removeMember({
                  userId: row.userId,
                  organizationId: props.organizationId,
                });
              } finally {
                setBusyKey(null);
              }
            }}
            busyKey={busyKey}
          />
        </CardContent>
      </Card>
    </div>
  );
};

const MembersTable = (props: {
  members: OrganizationMemberRow[];
  onRemove: (row: OrganizationMemberRow) => Promise<void>;
  busyKey: string | null;
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.members.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-muted-foreground text-sm">
              No members.
            </TableCell>
          </TableRow>
        ) : (
          props.members.map((m) => (
            <TableRow key={m.userId}>
              <TableCell className="font-mono text-xs">{m.userId}</TableCell>
              <TableCell>{m.role}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={props.busyKey === `rm:${m.userId}`}
                  onClick={() => props.onRemove(m)}
                >
                  {props.busyKey === `rm:${m.userId}` ? "…" : "Remove"}
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

