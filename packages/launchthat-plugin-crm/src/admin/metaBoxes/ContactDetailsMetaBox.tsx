"use client";

import type { PluginMetaBoxRendererProps } from "launchthat-plugin-core";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@acme/ui/command";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";

import { ContactMarketingTagsManager } from "./ContactMarketingTagsManager";

// Avoid importing the generated Convex `api` with full types in a client component.
// The generated api types are extremely deep and can trip TS' instantiation limit.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const apiAny = require("@convex-config/_generated/api") as any;

const asString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

type UserRow = {
  _id: string;
  name?: string;
  email?: string;
};

export function ContactDetailsMetaBox({
  getValue,
  setValue,
  context,
}: PluginMetaBoxRendererProps) {
  // Allow editing while creating a new record (values will be persisted on first save).
  const canEdit = Boolean(context.postId) || context.isNewRecord;
  const organizationId =
    typeof context.organizationId === "string" ? context.organizationId : null;

  const [userSelectOpen, setUserSelectOpen] = useState(false);

  const usersRaw = useQuery(
    apiAny.api.core.organizations.queries.getOrganizationMembers,
    organizationId ? { organizationId } : "skip",
  ) as unknown;
  const userOptions = useMemo(() => {
    const members = (Array.isArray(usersRaw) ? usersRaw : []) as Array<{
      user?: { _id?: string; name?: string; email?: string } | null;
    }>;
    return members
      .map((m) => {
        const u = (m?.user ?? null) as UserRow | null;
        const id = typeof u?._id === "string" ? u._id : "";
        const email = typeof u?.email === "string" ? u.email : "";
        const name = typeof u?.name === "string" ? u.name : "";
        const label =
          name && email ? `${name} (${email})` : name || email || id;
        return id ? { id, label } : null;
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }, [usersRaw]);

  const linkedUserId = asString(getValue("contact.userId"));
  const linkedUserLabel =
    userOptions.find((u) => u.id === linkedUserId)?.label ??
    (linkedUserId ? linkedUserId : "");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
        <Label className="text-muted-foreground text-xs">
          Linked portal user (optional)
        </Label>
        <Popover open={userSelectOpen} onOpenChange={setUserSelectOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              disabled={!canEdit}
            >
              {linkedUserLabel || "Select a user (optional)"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[360px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search users..." />
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="(not linked)"
                  onSelect={() => {
                    setValue("contact.userId", null);
                    setUserSelectOpen(false);
                  }}
                >
                  (not linked)
                </CommandItem>
                {userOptions.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.label}
                    onSelect={() => {
                      setValue("contact.userId", opt.id);
                      setUserSelectOpen(false);
                    }}
                  >
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        <p className="text-muted-foreground text-xs">
          This stores the user id in contact meta (`contact.userId`). It does
          not change authentication; it is used for CRM identity + tagging
          workflows.
        </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="crm-contact-first-name">First name</Label>
          <Input
            id="crm-contact-first-name"
            value={asString(getValue("contact.firstName"))}
            onChange={(e) =>
              setValue("contact.firstName", e.currentTarget.value.trim() || null)
            }
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="crm-contact-last-name">Last name</Label>
          <Input
            id="crm-contact-last-name"
            value={asString(getValue("contact.lastName"))}
            onChange={(e) =>
              setValue("contact.lastName", e.currentTarget.value.trim() || null)
            }
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="crm-contact-email">Email address</Label>
          <Input
            id="crm-contact-email"
            type="email"
            value={asString(getValue("contact.email"))}
            onChange={(e) =>
              setValue("contact.email", e.currentTarget.value.trim() || null)
            }
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="crm-contact-phone">Phone</Label>
          <Input
            id="crm-contact-phone"
            value={asString(getValue("contact.phone"))}
            onChange={(e) =>
              setValue("contact.phone", e.currentTarget.value.trim() || null)
            }
            disabled={!canEdit}
          />
        </div>
      </div>

      {typeof context.postId === "string" && context.postId.trim() ? (
        <ContactMarketingTagsManager
          organizationId={organizationId}
          contactId={context.postId}
          canEdit={canEdit}
        />
      ) : (
        <div className="text-muted-foreground text-sm">
          Save this contact to manage marketing tags.
        </div>
      )}
    </div>
  );
}
