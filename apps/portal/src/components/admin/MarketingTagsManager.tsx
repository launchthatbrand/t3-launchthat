"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Plus, Settings, Tag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";
import { useMarketingTags } from "~/hooks/useMarketingTags";
import { useAction, useMutation, useQuery } from "convex/react";
import { useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const apiAny: any = require("@/convex/_generated/api").api;

interface CreateTagFormData {
  name: string;
  slug: string;
  description: string;
  color: string;
  category: string;
}

export function MarketingTagsManager() {
  const { marketingTags, createTag, organizationId } = useMarketingTags();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeDiscordTagId, setActiveDiscordTagId] = useState<string | null>(null);
  const [discordSelectedGuildId, setDiscordSelectedGuildId] = useState<string | null>(
    null,
  );
  const [discordSelectedRoleId, setDiscordSelectedRoleId] = useState<string | null>(
    null,
  );
  const [discordRolesForGuild, setDiscordRolesForGuild] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoadingDiscordRoles, setIsLoadingDiscordRoles] = useState(false);

  const discordRoleRules = useQuery(
    apiAny.plugins.discord.roleRules.listRoleRulesForMarketingTags,
    organizationId && activeDiscordTagId
      ? ({ organizationId, marketingTagIds: [activeDiscordTagId] } as any)
      : "skip",
  ) as
    | Array<{
        marketingTagId: string;
        guildId?: string;
        roleId: string;
        roleName?: string;
        enabled: boolean;
      }>
    | undefined;

  const saveDiscordTagRoles = useMutation(
    apiAny.plugins.discord.roleRules.replaceMarketingTagRoleRules,
  ) as unknown as (args: {
    organizationId: string;
    marketingTagId: string;
    rules: Array<{ guildId: string; roleId: string; roleName?: string }>;
  }) => Promise<null>;

  const discordGuildConnections = useQuery(
    apiAny.plugins.discord.queries.listGuildConnectionsForOrg,
    organizationId ? { organizationId } : "skip",
  ) as Array<{ guildId: string; guildName?: string }> | undefined;

  const listDiscordRolesForGuild = useAction(
    apiAny.plugins.discord.actions.listRolesForGuild,
  ) as unknown as (args: {
    organizationId: string;
    guildId: string;
  }) => Promise<Array<{ id: string; name: string }>>;

  const [formData, setFormData] = useState<CreateTagFormData>({
    name: "",
    slug: "",
    description: "",
    color: "#3B82F6",
    category: "",
  });

  const handleCreateTag = async () => {
    try {
      await createTag({
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        color: formData.color,
        category: formData.category || undefined,
        isActive: true,
      });

      toast.success("Marketing tag created successfully!");
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        slug: "",
        description: "",
        color: "#3B82F6",
        category: "",
      });
    } catch (error) {
      toast.error(`Failed to create tag: ${error}`);
    }
  };

  const handleAssignTag = async () => {
    toast.info("Assigning tags is handled on CRM contacts; use the user/contact tag manager.");
  };

  const openDiscordRolesDialog = (tagId: string) => {
    setActiveDiscordTagId(tagId);
    setDiscordSelectedGuildId(null);
    setDiscordSelectedRoleId(null);
    setDiscordRolesForGuild([]);
  };

  const selectedDiscordRules = (discordRoleRules ?? [])
    .filter((r) => r.enabled)
    .map((r) => ({
      guildId: typeof r.guildId === "string" ? r.guildId : "",
      roleId: r.roleId,
      roleName: r.roleName,
    }))
    .filter((r) => r.guildId && r.roleId);

  const handleSelectDiscordGuild = async (guildId: string) => {
    if (!organizationId) return;
    setDiscordSelectedGuildId(guildId);
    setDiscordSelectedRoleId(null);
    setDiscordRolesForGuild([]);
    try {
      setIsLoadingDiscordRoles(true);
      const roles = await listDiscordRolesForGuild({ organizationId, guildId });
      setDiscordRolesForGuild(
        Array.isArray(roles)
          ? roles.map((r) => ({ id: String(r.id), name: String(r.name) }))
          : [],
      );
    } finally {
      setIsLoadingDiscordRoles(false);
    }
  };

  const handleAddDiscordRule = async () => {
    if (!organizationId || !activeDiscordTagId) return;
    if (!discordSelectedGuildId || !discordSelectedRoleId) return;
    const role = discordRolesForGuild.find((r) => r.id === discordSelectedRoleId);
    const key = `${discordSelectedGuildId}\\u0000${discordSelectedRoleId}`;
    const keys = new Set(
      selectedDiscordRules.map((r) => `${r.guildId}\\u0000${r.roleId}`),
    );
    if (keys.has(key)) return;
    await saveDiscordTagRoles({
      organizationId,
      marketingTagId: activeDiscordTagId,
      rules: [
        ...selectedDiscordRules,
        {
          guildId: discordSelectedGuildId,
          roleId: discordSelectedRoleId,
          roleName: role?.name,
        },
      ],
    });
    toast.success("Discord role added");
    setDiscordSelectedRoleId(null);
  };

  const handleRemoveDiscordRule = async (guildId: string, roleId: string) => {
    if (!organizationId || !activeDiscordTagId) return;
    await saveDiscordTagRoles({
      organizationId,
      marketingTagId: activeDiscordTagId,
      rules: selectedDiscordRules.filter(
        (r) => !(r.guildId === guildId && r.roleId === roleId),
      ),
    });
    toast.success("Discord role removed");
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setFormData((prev) => ({
      ...prev,
      name,
      slug,
    }));
  };

  if (marketingTags === undefined) {
    return <div>Loading marketing tags...</div>;
  }

  const categories = [
    ...new Set(
      marketingTags.filter((tag) => tag.category).map((tag) => tag.category),
    ),
  ];

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Tags</h1>
          <p className="text-muted-foreground">
            Manage user segmentation and access control tags
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Marketing Tag</DialogTitle>
                <DialogDescription>
                  Create a new marketing tag for user segmentation and access
                  control.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Premium Member"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="premium-member"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Users with premium membership access"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    placeholder="membership"
                  />
                </div>

                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTag}
                  disabled={!formData.name || !formData.slug}
                >
                  Create Tag
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      {/* Tags Overview */}
      <div className="grid gap-6">
        {categories.length > 0
          ? categories.map((category) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    {category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {marketingTags
                      .filter((tag) => tag.category === category)
                      .map((tag) => (
                        <div
                          key={tag._id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="h-4 w-4 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <div>
                              <p className="font-medium">{tag.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {tag.slug}
                              </p>
                              {tag.description && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {tag.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={tag.isActive ? "default" : "secondary"}
                            >
                              {tag.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Dialog
                              open={activeDiscordTagId === String(tag._id)}
                              onOpenChange={(open) =>
                                setActiveDiscordTagId(open ? String(tag._id) : null)
                              }
                            >
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openDiscordRolesDialog(String(tag._id))}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Discord role mapping</DialogTitle>
                                  <DialogDescription>
                                    When this marketing tag is assigned, the user will be granted these Discord roles.
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-3">
                                  <div className="text-sm">
                                    <div className="font-medium">{tag.name}</div>
                                    <div className="text-muted-foreground text-xs">{tag.slug}</div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Add role</Label>
                                    <div className="grid gap-2 md:grid-cols-2">
                                      <Select
                                        value={discordSelectedGuildId ?? undefined}
                                        onValueChange={(v) => void handleSelectDiscordGuild(v)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a server…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {(discordGuildConnections ?? []).map((g) => (
                                            <SelectItem key={g.guildId} value={g.guildId}>
                                              {g.guildName ? `${g.guildName} (${g.guildId})` : g.guildId}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>

                                      <Select
                                        value={discordSelectedRoleId ?? undefined}
                                        onValueChange={(v) => setDiscordSelectedRoleId(v)}
                                        disabled={!discordSelectedGuildId || isLoadingDiscordRoles}
                                      >
                                        <SelectTrigger>
                                          <SelectValue
                                            placeholder={
                                              !discordSelectedGuildId
                                                ? "Select a server first…"
                                                : isLoadingDiscordRoles
                                                  ? "Loading roles…"
                                                  : "Select a role…"
                                            }
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {discordRolesForGuild.map((r) => (
                                            <SelectItem key={r.id} value={r.id}>
                                              {r.name} ({r.id})
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => void handleAddDiscordRule()}
                                        disabled={!discordSelectedGuildId || !discordSelectedRoleId}
                                      >
                                        Add
                                      </Button>
                                      <div className="text-xs text-muted-foreground">
                                        Selected: {selectedDiscordRules.length}
                                      </div>
                                    </div>

                                    <div className="max-h-44 space-y-2 overflow-auto pr-1">
                                      {selectedDiscordRules.map((r) => (
                                        <div
                                          key={`${r.guildId}:${r.roleId}`}
                                          className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                                        >
                                          <div className="min-w-0">
                                            <div className="truncate font-medium">
                                              {r.roleName ? r.roleName : r.roleId}
                                            </div>
                                            <div className="text-muted-foreground truncate text-xs">
                                              Guild: {r.guildId} • Role: {r.roleId}
                                            </div>
                                          </div>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => void handleRemoveDiscordRule(r.guildId, r.roleId)}
                                          >
                                            Remove
                                          </Button>
                                        </div>
                                      ))}
                                      {selectedDiscordRules.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">
                                          No Discord roles configured for this tag yet.
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>

                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setActiveDiscordTagId(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={() => setActiveDiscordTagId(null)}>
                                    Done
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))
          : null}

        {/* Uncategorized Tags */}
        {marketingTags.filter((tag) => !tag.category).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Uncategorized
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {marketingTags
                  .filter((tag) => !tag.category)
                  .map((tag) => (
                    <div
                      key={tag._id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <div>
                          <p className="font-medium">{tag.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {tag.slug}
                          </p>
                          {tag.description && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {tag.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={tag.isActive ? "default" : "secondary"}>
                          {tag.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
