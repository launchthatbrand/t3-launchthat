"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";

import type {
  CoreTenantOrganizationsUiApi,
} from "./organizations/types";

import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

export interface OrganizationSwitcherProps {
  api: CoreTenantOrganizationsUiApi;
  userId: string | null | undefined;
  label?: string;
  className?: string;
  onSwitched?: (next: {
    organizationId: string;
    slug: string;
    name: string;
  }) => void;
}

export const OrganizationSwitcher = (props: OrganizationSwitcherProps) => {
  const label = props.label ?? "Organization";

  const rows = useQuery(
    props.api.launchthat_core_tenant.queries.listOrganizationsByUserId,
    props.userId ? { userId: props.userId } : "skip",
  );

  const setActive = useMutation(
    props.api.launchthat_core_tenant.mutations.setActiveOrganizationForUser,
  );

  const active = React.useMemo(() => {
    if (!Array.isArray(rows)) return null;
    return rows.find((r) => r.isActive) ?? rows[0] ?? null;
  }, [rows]);

  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleChange = async (organizationId: string) => {
    if (!props.userId) return;
    setIsUpdating(true);
    try {
      await setActive({ userId: props.userId, organizationId });
      const nextRow =
        Array.isArray(rows) ? rows.find((r) => r.organizationId === organizationId) : null;
      if (nextRow) {
        props.onSwitched?.({
          organizationId: nextRow.organizationId,
          slug: nextRow.org.slug,
          name: nextRow.org.name,
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const disabled = !props.userId || isUpdating || rows === undefined;

  return (
    <div className={props.className}>
      <div className="space-y-1">
        <Label>{label}</Label>
        <Select
          value={active?.organizationId ?? ""}
          onValueChange={handleChange}
          disabled={disabled}
        >
          <SelectTrigger className="min-w-56">
            <SelectValue
              placeholder={!props.userId ? "Sign in to select" : rows ? "Select" : "Loading…"}
            />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(rows) && rows.length > 0 ? (
              rows.map((row) => (
                <SelectItem key={row.organizationId} value={row.organizationId}>
                  {row.org.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="__none__" disabled>
                No organizations
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

