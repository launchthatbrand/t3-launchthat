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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@acme/ui/sidebar";
import { toast } from "@acme/ui/toast";

import { SUPPORT_COPY } from "../constants/supportCopy";

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

// This is sample data.
const data = {
  navMain: [
    {
      title: "Getting Started",
      url: "#",
      items: [
        {
          title: "Installation",
          url: "#",
        },
        {
          title: "Project Structure",
          url: "#",
        },
      ],
    },
    {
      title: "Building Your Application",
      url: "#",
      items: [
        {
          title: "Routing",
          url: "#",
        },
        {
          title: "Data Fetching",
          url: "#",
          isActive: true,
        },
        {
          title: "Rendering",
          url: "#",
        },
        {
          title: "Caching",
          url: "#",
        },
        {
          title: "Styling",
          url: "#",
        },
        {
          title: "Optimizing",
          url: "#",
        },
        {
          title: "Configuring",
          url: "#",
        },
        {
          title: "Testing",
          url: "#",
        },
        {
          title: "Authentication",
          url: "#",
        },
        {
          title: "Deploying",
          url: "#",
        },
        {
          title: "Upgrading",
          url: "#",
        },
        {
          title: "Examples",
          url: "#",
        },
      ],
    },
    {
      title: "API Reference",
      url: "#",
      items: [
        {
          title: "Components",
          url: "#",
        },
        {
          title: "File Conventions",
          url: "#",
        },
        {
          title: "Functions",
          url: "#",
        },
        {
          title: "next.config.js Options",
          url: "#",
        },
        {
          title: "CLI",
          url: "#",
        },
        {
          title: "Edge Runtime",
          url: "#",
        },
      ],
    },
    {
      title: "Architecture",
      url: "#",
      items: [
        {
          title: "Accessibility",
          url: "#",
        },
        {
          title: "Fast Refresh",
          url: "#",
        },
        {
          title: "Next.js Compiler",
          url: "#",
        },
        {
          title: "Supported Browsers",
          url: "#",
        },
        {
          title: "Turbopack",
          url: "#",
        },
      ],
    },
    {
      title: "Community",
      url: "#",
      items: [
        {
          title: "Contribution Guide",
          url: "#",
        },
      ],
    },
  ],
};

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

export function ConversationSidebar({
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
              <AvatarFallback>{initialsFrom(contactName)}</AvatarFallback>
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
            <InfoRow icon={Mail} label="Email" value={contactEmail ?? "—"} />
            <InfoRow icon={Phone} label="Phone" value={contact?.phone ?? "—"} />
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
              <div className="space-y-3 px-4 pt-1 pb-4 text-sm">
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
            <AccordionTrigger className="px-4">Quick actions</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 px-4 pt-1 pb-4">
                <div className="rounded-lg border px-3 py-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {isAgentMode ? "Agent mode" : "Manual mode"}
                      </span>
                      <span className="text-muted-foreground">
                        {isAgentMode
                          ? "Assistant replies are enabled."
                          : "Assistant replies are paused for this chat."}
                      </span>
                      {assignedAgentName ? (
                        <span className="text-muted-foreground text-[11px]">
                          Assigned to {assignedAgentName}
                        </span>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleToggleMode()}
                      disabled={!conversation || !organizationId}
                    >
                      {isAgentMode ? "Pause agent" : "Enable agent"}
                    </Button>
                  </div>
                </div>
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

const InfoRow = ({ icon: Icon, label, value }: InfoRowProps) => (
  <div className="flex items-center gap-3 text-sm">
    <Icon className="text-muted-foreground h-4 w-4" />
    <div className="flex flex-col">
      <span className="text-muted-foreground text-[11px] tracking-wide uppercase">
        {label}
      </span>
      <span className="text-foreground">{value}</span>
    </div>
  </div>
);
