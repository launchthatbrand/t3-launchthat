"use client";

import React, { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

interface RoleRule {
  guildId?: string;
  roleId: string;
  roleName?: string;
  enabled: boolean;
}

interface GuildConnection {
  guildId: string;
  guildName?: string;
}

interface DiscordRole {
  id: string;
  name: string;
}

export const DiscordProductRoleRulesSection = (props: {
  organizationId: string;
  productId: string;
  canEdit: boolean;
}) => {
  const { organizationId, productId, canEdit } = props;
  const [search, setSearch] = useState("");
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
  const [rolesForGuild, setRolesForGuild] = useState<DiscordRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // Avoid TS "type instantiation is excessively deep" by reading function refs via `unknown` records,
  // instead of letting TS expand the full generated Convex `api` type graph.
  const useQueryUntyped = useQuery as unknown as (
    func: unknown,
    args: unknown,
  ) => unknown;
  const useMutationUntyped = useMutation as unknown as (
    func: unknown,
  ) => unknown;
  const useActionUntyped = useAction as unknown as (func: unknown) => unknown;

  const apiUntyped = api as unknown as Record<string, unknown>;
  const plugins = apiUntyped["plugins"] as Record<string, unknown>;
  const discord = plugins["discord"] as Record<string, unknown>;
  const discordRoleRules = discord["roleRules"] as Record<string, unknown>;
  const discordQueries = discord["queries"] as Record<string, unknown>;
  const discordActions = discord["actions"] as Record<string, unknown>;

  const existing = useQueryUntyped(
    discordRoleRules["listRoleRulesForProduct"],
    organizationId && productId ? { organizationId, productId } : "skip",
  ) as RoleRule[] | undefined;

  const replaceRules = useMutationUntyped(
    discordRoleRules["replaceProductRoleRules"],
  ) as unknown as (args: {
    organizationId: string;
    productId: string;
    rules: { guildId: string; roleId: string; roleName?: string }[];
  }) => Promise<null>;

  const guildConnections = useQueryUntyped(
    discordQueries["listGuildConnectionsForOrg"],
    organizationId ? { organizationId } : "skip",
  ) as GuildConnection[] | undefined;

  const listRolesForGuild = useActionUntyped(
    discordActions["listRolesForGuild"],
  ) as unknown as (args: {
    organizationId: string;
    guildId: string;
  }) => Promise<{ id: string; name: string }[]>;

  const selectedRules = useMemo(() => {
    const list = Array.isArray(existing) ? existing : [];
    return list
      .filter((r) => r.enabled)
      .map((r) => ({
        guildId: typeof r.guildId === "string" ? r.guildId : "",
        roleId: r.roleId,
        roleName: r.roleName,
      }))
      .filter((r) => r.guildId && r.roleId);
  }, [existing]);

  const selectedKeySet = useMemo(() => {
    return new Set(selectedRules.map((r) => `${r.guildId}\\u0000${r.roleId}`));
  }, [selectedRules]);

  const visibleSelected = useMemo((): {
    guildId: string;
    roleId: string;
    roleName?: string;
  }[] => {
    const q = search.trim().toLowerCase();
    const ids = selectedRules;
    if (!q) return ids;
    return ids.filter((r) => {
      const hay = `${r.guildId} ${r.roleName ?? ""} ${r.roleId}`.toLowerCase();
      return hay.includes(q);
    });
  }, [selectedRules, search]);

  const save = async (
    next: { guildId: string; roleId: string; roleName?: string }[],
  ) => {
    await replaceRules({ organizationId, productId, rules: next });
  };

  const handleSelectGuild = async (guildId: string) => {
    setSelectedGuildId(guildId);
    setSelectedRoleId(null);
    setRolesForGuild([]);
    if (!guildId) return;
    try {
      setIsLoadingRoles(true);
      const roles = await listRolesForGuild({ organizationId, guildId });
      setRolesForGuild(
        Array.isArray(roles)
          ? roles.map((r) => ({ id: String(r.id), name: String(r.name) }))
          : [],
      );
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleAddRule = async () => {
    if (!selectedGuildId || !selectedRoleId) return;
    const role = rolesForGuild.find((r) => r.id === selectedRoleId);
    const key = `${selectedGuildId}\\u0000${selectedRoleId}`;
    if (selectedKeySet.has(key)) return;
    await save([
      ...selectedRules,
      {
        guildId: selectedGuildId,
        roleId: selectedRoleId,
        roleName: role?.name,
      },
    ]);
  };

  const handleRemoveRule = async (guildId: string, roleId: string) => {
    const next = selectedRules.filter(
      (r) => !(r.guildId === guildId && r.roleId === roleId),
    );
    await save(next);
  };

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="space-y-1">
        <Label className="text-base font-semibold">
          Discord: grant roles on purchase
        </Label>
        <p className="text-muted-foreground text-xs">
          When this product is purchased, the buyer will be reconciled to these
          Discord roles (add/remove managed roles).
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Search selected roles</Label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Filter by guild / role…"
            disabled={!canEdit}
          />
        </div>
        <div className="space-y-2">
          <Label>Add role</Label>
          <div className="grid gap-2 md:grid-cols-2">
            <Select
              value={selectedGuildId ?? undefined}
              onValueChange={(v) => void handleSelectGuild(v)}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a server…" />
              </SelectTrigger>
              <SelectContent>
                {(guildConnections ?? []).map((g) => (
                  <SelectItem key={g.guildId} value={g.guildId}>
                    {g.guildName ? `${g.guildName} (${g.guildId})` : g.guildId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedRoleId ?? undefined}
              onValueChange={(v) => setSelectedRoleId(v)}
              disabled={!canEdit || !selectedGuildId || isLoadingRoles}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedGuildId
                      ? "Select a server first…"
                      : isLoadingRoles
                        ? "Loading roles…"
                        : "Select a role…"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {rolesForGuild.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} ({r.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleAddRule()}
              disabled={!canEdit || !selectedGuildId || !selectedRoleId}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="text-muted-foreground text-xs">
        Selected: {selectedRules.length}
      </div>

      <div className="max-h-56 space-y-2 overflow-auto pr-1">
        {visibleSelected.map((rule) => (
          <label
            key={`${rule.guildId}:${rule.roleId}`}
            className="hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm"
          >
            <Checkbox
              checked={true}
              onCheckedChange={(value) =>
                value === false
                  ? void handleRemoveRule(rule.guildId, rule.roleId)
                  : undefined
              }
              disabled={!canEdit}
            />
            <div className="min-w-0">
              <div className="truncate font-medium">
                {rule.roleName ?? rule.roleId}
              </div>
              <div className="text-muted-foreground truncate text-xs">
                Guild: {rule.guildId} • Role: {rule.roleId}
              </div>
            </div>
          </label>
        ))}

        {visibleSelected.length === 0 ? (
          <div className="text-muted-foreground text-sm">
            No roles selected yet.
          </div>
        ) : null}
      </div>
    </div>
  );
};
