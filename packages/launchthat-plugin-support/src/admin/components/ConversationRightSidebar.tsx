import type { GenericId as Id } from "convex/values";
import * as React from "react";
import { api } from "@portal/convexspec";
import { useMutation } from "convex/react";
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

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Avatar, AvatarFallback } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarRail,
} from "@acme/ui/sidebar";
import { toast } from "@acme/ui/toast";

import { SUPPORT_COPY } from "../constants/supportCopy";
import { AgentModeToggle } from "./AgentModeToggle";
import {
  ContactInfoRow,
  formatDateTime,
  getInitials,
} from "./shared/contactUtils";

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
  assignedAgentId?: string;
  assignedAgentName?: string;
  mode?: "agent" | "manual";
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

export interface ConversationSidebarProps {
  conversation: ConversationSummary | undefined;
  contact: ContactDoc | null;
  fallbackName?: string;
  fallbackEmail?: string;
  organizationName?: string;
  organizationId?: Id<"organizations">;
}

export function ConversationRightSidebar({
  conversation,
  contact,
  fallbackName,
  fallbackEmail,
  organizationName,
  organizationId,
  ...props
}: React.ComponentProps<typeof Sidebar> & ConversationSidebarProps) {
  const setConversationMode = useMutation(
    api.plugins.support.mutations.setConversationMode,
  );
  const contactName = contact?.fullName ?? fallbackName ?? "Unknown visitor";
  const contactEmail = contact?.email ?? fallbackEmail;
  const company = contact?.company;
  const hasEmail = Boolean(contactEmail);
  const hasContactRecord = Boolean(contact?._id);
  const contactId = contact?._id;

  const handleEmailContact = React.useCallback(() => {
    if (!hasEmail || !contactEmail) {
      toast.info("This contact does not have an email address yet.");
      return;
    }
    if (typeof window === "undefined") return;
    window.open(`mailto:${contactEmail}`, "_blank", "noopener,noreferrer");
  }, [contactEmail, hasEmail]);

  const handleViewContact = React.useCallback(() => {
    if (!hasContactRecord || !contactId) {
      toast.info("Contact record not found. Sync the contact to continue.");
      return;
    }
    if (typeof window === "undefined") return;
    const targetUrl = `/admin/contacts?contactId=${contactId}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }, [contactId, hasContactRecord]);
  const currentMode = conversation?.mode ?? "agent";
  const isAgentMode = currentMode === "agent";
  const assignedAgentName =
    conversation?.assignedAgentName ??
    (conversation?.assignedAgentId ? "Agent" : undefined);

  const handleToggleMode = React.useCallback(async () => {
    if (!conversation || !organizationId) {
      toast.info("Select a conversation to change agent mode.");
      return;
    }
    try {
      await setConversationMode({
        organizationId,
        sessionId: conversation.sessionId,
        mode: isAgentMode ? "manual" : "agent",
      });
      toast.success(
        isAgentMode
          ? "Switched to manual mode. The assistant will stop replying."
          : "Agent mode enabled. The assistant can reply again.",
      );
    } catch (error) {
      console.error("[conversation-sidebar] toggle mode", error);
      toast.error("Unable to update agent mode. Please try again.");
    }
  }, [conversation, isAgentMode, organizationId, setConversationMode]);

  return (
    <Sidebar {...props}>
      <SidebarContent className="space-y-4 p-4">
        <AgentModeToggle
          isAgentMode={isAgentMode}
          assignedAgentName={assignedAgentName}
          disabled={!conversation || !organizationId}
          onToggle={() => void handleToggleMode()}
        />
        {/* <SidebarGroup>
          <SidebarGroupLabel>Table of Contents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="font-medium">
                      {item.title}
                    </a>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={item.isActive}
                          >
                            <a href={item.url}>{item.title}</a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{getInitials(contactName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg">{contactName}</CardTitle>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
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
            <ContactInfoRow
              icon={Mail}
              label="Email"
              value={contactEmail ?? "—"}
            />
            <ContactInfoRow
              icon={Phone}
              label="Phone"
              value={contact?.phone ?? "—"}
            />
            <ContactInfoRow
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
              <div className="space-y-3 px-4 pt-1 pb-4 text-sm">
                <ContactInfoRow
                  icon={Hash}
                  label="Session"
                  value={
                    conversation
                      ? conversation.sessionId.slice(-12)
                      : SUPPORT_COPY.inspector.sessionPlaceholder
                  }
                />
                <ContactInfoRow
                  icon={MessageSquare}
                  label="Messages"
                  value={
                    conversation
                      ? `${conversation.totalMessages} messages`
                      : "—"
                  }
                />
                <ContactInfoRow
                  icon={CalendarClock}
                  label="Started"
                  value={formatDateTime(conversation?.firstAt)}
                />
                <ContactInfoRow
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
            <AccordionTrigger className="px-4">Quick actions</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 px-4 pt-1 pb-4">
                <div className="flex flex-wrap gap-2">
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
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="details" className="rounded-lg border">
            <AccordionTrigger className="px-4">
              Conversation details
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-muted-foreground space-y-3 px-4 pt-1 pb-4 text-xs">
                <div>
                  <p className="text-foreground font-medium">Participants</p>
                  <p>
                    Assistant,{" "}
                    {contactName === "Unknown visitor"
                      ? "Visitor"
                      : contactName}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-foreground font-medium">Tags</p>
                  <p>
                    {contact?.tags && contact.tags.length > 0
                      ? contact.tags.join(", ")
                      : "No tags"}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-foreground font-medium">Notes</p>
                  <p>No notes recorded yet.</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

interface InfoRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}
