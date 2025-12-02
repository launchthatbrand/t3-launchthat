"use client";

import React, { useState } from "react";
import { Id } from "@convex-config/_generated/dataModel";
import {
  Check,
  Clock,
  HelpCircle,
  MoreVertical,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@acme/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";

type AttendeeStatus =
  | "accepted"
  | "tentative"
  | "invited"
  | "declined"
  | "waitlisted";

type EventAttendee = {
  _id: Id<"posts">;
  status: AttendeeStatus;
  responseComment?: string;
  user?: {
    name?: string;
    imageUrl?: string;
  };
};

interface AttendeesListProps {
  eventId: Id<"posts">;
  isOrganizer?: boolean;
  className?: string;
}

export function AttendeesList({
  eventId,
  isOrganizer = false,
  className,
}: AttendeesListProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [attendees] = useState<EventAttendee[]>([]);

  // Group attendees by status
  const attendeesByStatus: Record<AttendeeStatus, EventAttendee[]> = {
    accepted: attendees.filter((a) => a.status === "accepted"),
    tentative: attendees.filter((a) => a.status === "tentative"),
    invited: attendees.filter((a) => a.status === "invited"),
    declined: attendees.filter((a) => a.status === "declined"),
    waitlisted: attendees.filter((a) => a.status === "waitlisted"),
  };

  const hasAttendees = attendees.length > 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Attendees</CardTitle>
        {isOrganizer && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={() => setIsInviteDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Invite
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!hasAttendees && (
          <p className="text-muted-foreground text-sm">
            Attendee tracking will be available soon.
          </p>
        )}
        {hasAttendees && (
          <>
            <AttendeeSection
              title="Going"
              attendees={attendeesByStatus.accepted}
              icon={<Check className="h-4 w-4 text-green-500" />}
              isOrganizer={isOrganizer}
              eventId={eventId}
            />

            <AttendeeSection
              title="Maybe"
              attendees={attendeesByStatus.tentative}
              icon={<HelpCircle className="h-4 w-4 text-amber-500" />}
              isOrganizer={isOrganizer}
              eventId={eventId}
            />

            <AttendeeSection
              title="Pending"
              attendees={attendeesByStatus.invited}
              icon={<Clock className="h-4 w-4 text-blue-500" />}
              isOrganizer={isOrganizer}
              eventId={eventId}
            />

            <AttendeeSection
              title="Declined"
              attendees={attendeesByStatus.declined}
              icon={<X className="h-4 w-4 text-red-500" />}
              isOrganizer={isOrganizer}
              eventId={eventId}
              collapsed={true}
            />
          </>
        )}
      </CardContent>

      {isInviteDialogOpen && (
        <InviteAttendeesDialog
          eventId={eventId}
          onClose={() => setIsInviteDialogOpen(false)}
          currentAttendees={attendees}
        />
      )}
    </Card>
  );
}

interface AttendeeSectionProps {
  title: string;
  attendees: EventAttendee[];
  icon: React.ReactNode;
  isOrganizer: boolean;
  eventId: Id<"posts">;
  collapsed?: boolean;
}

function AttendeeSection({
  title,
  attendees,
  icon,
  isOrganizer,
  eventId,
  collapsed = false,
}: AttendeeSectionProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsed);

  if (attendees.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div
        className="mb-2 flex cursor-pointer items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-medium">
            {title} ({attendees.length})
          </h3>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <span className="sr-only">Toggle</span>
          <ChevronIcon expanded={isExpanded} />
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {attendees.map((attendee) => (
            <AttendeeRow
              key={attendee._id}
              attendee={attendee}
              isOrganizer={isOrganizer}
              eventId={eventId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "transform transition-transform",
        expanded ? "rotate-180" : "",
      )}
    >
      <path
        d="M2 4L6 8L10 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface AttendeeRowProps {
  attendee: EventAttendee;
  isOrganizer: boolean;
  eventId: Id<"posts">;
}

function AttendeeRow({ attendee, isOrganizer, eventId }: AttendeeRowProps) {
  const statusIcons = {
    accepted: <Check className="h-4 w-4 text-green-500" />,
    tentative: <HelpCircle className="h-4 w-4 text-amber-500" />,
    invited: <Clock className="h-4 w-4 text-blue-500" />,
    declined: <X className="h-4 w-4 text-red-500" />,
    waitlisted: <Clock className="h-4 w-4 text-purple-500" />,
  };

  const user = attendee.user;
  if (!user) return null;

  // Get initials for avatar fallback
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "?";

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.imageUrl} alt={user.name || "User"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{user.name || "Unknown User"}</p>
          {attendee.responseComment && (
            <p className="text-muted-foreground text-xs">
              {attendee.responseComment}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {statusIcons[attendee.status as keyof typeof statusIcons]}

        {isOrganizer && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Remove</DropdownMenuItem>
              <DropdownMenuItem>Change Role</DropdownMenuItem>
              <DropdownMenuItem>Resend Invitation</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

interface InviteAttendeesDialogProps {
  eventId: Id<"posts">;
  onClose: () => void;
  currentAttendees: any[];
}

function InviteAttendeesDialog({
  eventId,
  onClose,
  currentAttendees,
}: InviteAttendeesDialogProps) {
  // This component would contain the UI for inviting new attendees
  // For now, we'll just show a placeholder message
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Attendees</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground text-center">
            Attendee invitation functionality will be implemented here.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
