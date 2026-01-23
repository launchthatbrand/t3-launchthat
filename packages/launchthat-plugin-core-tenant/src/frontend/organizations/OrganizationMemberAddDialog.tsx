"use client";

import * as React from "react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

export interface AvailableUserOption {
  userId: string;
  label: string;
  name?: string;
  email?: string;
  sublabel?: string;
}

export interface OrganizationMemberAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableUsers: AvailableUserOption[];
  onAdd: (userId: string) => Promise<void>;
  isAdding?: boolean;
}

export const OrganizationMemberAddDialog = (props: OrganizationMemberAddDialogProps) => {
  const [selectedUserId, setSelectedUserId] = React.useState<string>("");

  React.useEffect(() => {
    if (props.open) setSelectedUserId("");
  }, [props.open]);

  const selected = props.availableUsers.find((u) => u.userId === selectedUserId);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user…" />
              </SelectTrigger>
              <SelectContent>
                {props.availableUsers.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No users available
                  </SelectItem>
                ) : (
                  props.availableUsers.map((u) => (
                    <SelectItem key={u.userId} value={u.userId}>
                      {u.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selected?.sublabel ? (
              <div className="text-muted-foreground text-xs">{selected.sublabel}</div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => props.onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedUserId || props.isAdding}
              onClick={async () => {
                if (!selectedUserId) return;
                await props.onAdd(selectedUserId);
                props.onOpenChange(false);
              }}
            >
              {props.isAdding ? "Adding…" : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

