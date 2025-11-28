"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Avatar, AvatarFallback } from "@acme/ui/avatar";
import {
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Clock,
  Hash,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  UserRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import type { ComponentType } from "react";
import type { GenericId as Id } from "convex/values";
import { SUPPORT_COPY } from "../constants/supportCopy";
import { ScrollArea } from "@acme/ui/scroll-area";
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";
import { useCallback } from "react";

export interface ConversationSummary {
  sessionId: string;
  lastMessage: string;
  lastRole: "user" | "assistant";
  lastAt: number;
  firstAt: number;
  totalMessages: number;
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  origin: "chat" | "email";
  status?: "open" | "snoozed" | "closed";
}

export interface ContactDoc {
  _id: Id<"contacts">;
  organizationId: Id<"organizations">;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  company?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ConversationInspectorProps {
  conversation: ConversationSummary | undefined;
  contact: ContactDoc | null;
  fallbackName?: string;
  fallbackEmail?: string;
  organizationName?: string;
}

const formatDateTime = (value?: number) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

const initialsFrom = (input?: string) => {
  if (!input) return "??";
  return input
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
};

export const ConversationInspector = ({
  conversation,
  contact,
  fallbackName,
  fallbackEmail,
  organizationName,
}: ConversationInspectorProps) => {
  const contactName = contact?.fullName ?? fallbackName ?? "Unknown visitor";
  const contactEmail = contact?.email ?? fallbackEmail;
  const company = contact?.company;
  const hasEmail = Boolean(contactEmail);
  const hasContactRecord = Boolean(contact?._id);
  const contactId = contact?._id;

  const handleEmailContact = useCallback(() => {
    if (!hasEmail || !contactEmail) {
      toast.info("This contact does not have an email address yet.");
      return;
    }
    if (typeof window === "undefined") return;
    window.open(`mailto:${contactEmail}`, "_blank", "noopener,noreferrer");
  }, [contactEmail, hasEmail]);

  const handleViewContact = useCallback(() => {
    if (!hasContactRecord || !contactId) {
      toast.info("Contact record not found. Sync the contact to continue.");
      return;
    }
    if (typeof window === "undefined") return;
    const targetUrl = `/admin/contacts?contactId=${contactId}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }, [contactId, hasContactRecord]);

  return (
    <div className="flex h-full flex-col border-l bg-background">
      <ScrollArea className="h-full">
        <div className="space-y-4 p-4">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{initialsFrom(contactName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-lg">{contactName}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {company ? (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {company}
                    </span>
                  ) : null}
                  {organizationName ? (
                    <>
                      <span>•</span>
                      <span>{organizationName}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow icon={Mail} label="Email" value={contactEmail ?? "—"} />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={contact?.phone ?? "—"}
              />
              <InfoRow
                icon={MapPin}
                label="Location"
                value={
                  contact?.tags
                    ?.find((tag) => tag.startsWith("location:"))
                    ?.split(":")[1] ?? "Not provided"
                }
              />
            </CardContent>
          </Card>

          <Accordion type="single" className="space-y-3">
            <AccordionItem value="overview" className="rounded-lg border">
              <AccordionTrigger className="px-4">
                Conversation overview
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 px-4 pb-4 pt-1 text-sm">
                  <InfoRow
                    icon={Hash}
                    label="Session"
                    value={
                      conversation
                        ? conversation.sessionId.slice(-12)
                        : SUPPORT_COPY.inspector.sessionPlaceholder
                    }
                  />
                  <InfoRow
                    icon={MessageSquare}
                    label="Messages"
                    value={
                      conversation
                        ? `${conversation.totalMessages} messages`
                        : "—"
                    }
                  />
                  <InfoRow
                    icon={CalendarClock}
                    label="Started"
                    value={formatDateTime(conversation?.firstAt)}
                  />
                  <InfoRow
                    icon={Clock}
                    label="Last activity"
                    value={formatDateTime(conversation?.lastAt)}
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="secondary">
                      {conversation?.lastRole === "assistant"
                        ? "Assistant replied"
                        : "Awaiting assistant"}
                    </Badge>
                    {contactEmail ? (
                      <BadgeCheck className="h-4 w-4 text-emerald-500" />
                    ) : null}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="actions" className="rounded-lg border">
              <AccordionTrigger className="px-4">
                Quick actions
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2 px-4 pb-4 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={handleEmailContact}
                    disabled={!hasEmail}
                    title={
                      hasEmail
                        ? undefined
                        : "No email available for this contact"
                    }
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email contact
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={handleViewContact}
                    disabled={!hasContactRecord}
                    title={
                      hasContactRecord
                        ? undefined
                        : "Contact profile not available in this workspace"
                    }
                  >
                    <UserRound className="h-3.5 w-3.5" />
                    View contact
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="details" className="rounded-lg border">
              <AccordionTrigger className="px-4">
                Conversation details
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 px-4 pb-4 pt-1 text-xs text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground">Participants</p>
                    <p>
                      Assistant,{" "}
                      {contactName === "Unknown visitor"
                        ? "Visitor"
                        : contactName}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="font-medium text-foreground">Tags</p>
                    <p>
                      {contact?.tags && contact.tags.length > 0
                        ? contact.tags.join(", ")
                        : "No tags"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="font-medium text-foreground">Notes</p>
                    <p>No notes recorded yet.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
};

interface InfoRowProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

const InfoRow = ({ icon: Icon, label, value }: InfoRowProps) => (
  <div className="flex items-center gap-3 text-sm">
    <Icon className="h-4 w-4 text-muted-foreground" />
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-foreground">{value}</span>
    </div>
  </div>
);
