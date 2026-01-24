"use client";

import React from "react";
import Image from "next/image";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { MediaLibraryDialog } from "launchthat-plugin-core-tenant/frontend";

import { api } from "@convex-config/_generated/api";
import type { Id } from "@convex-config/_generated/dataModel";
import { Switch } from "~/components/ui/switch";
import { UserPublicProfile, type UserPublicProfileConfigV1 } from "~/components/publicProfiles/UserPublicProfile";

interface UserMediaRow {
  _id: Id<"userMedia">;
  url: string | null;
  filename?: string;
  contentType: string;
  createdAt: number;
}

interface ViewerProfile {
  email: string;
  publicUsername?: string;
  name?: string;
  bio?: string;
  avatarMediaId?: Id<"userMedia">;
  coverMediaId?: Id<"userMedia">;
  avatarUrl?: string;
  coverUrl?: string;
  publicProfileConfig?: unknown;
}

const slugifyUsername = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

const DEFAULT_CONFIG: UserPublicProfileConfigV1 = {
  version: "v1",
  links: [],
  sections: [
    { id: "hero", kind: "hero", enabled: true },
    { id: "about", kind: "about", enabled: true },
    { id: "links", kind: "links", enabled: true },
    { id: "stats", kind: "stats", enabled: true },
  ],
};

const moveItem = <T,>(arr: T[], from: number, to: number): T[] => {
  if (from === to) return arr;
  if (from < 0 || from >= arr.length) return arr;
  if (to < 0 || to >= arr.length) return arr;
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  if (item === undefined) return arr;
  copy.splice(to, 0, item);
  return copy;
};

const normalizeConfig = (raw: unknown): UserPublicProfileConfigV1 => {
  if (!raw || typeof raw !== "object") return DEFAULT_CONFIG;
  const v = raw as Partial<UserPublicProfileConfigV1>;
  if (v.version !== "v1") return DEFAULT_CONFIG;
  return {
    version: "v1",
    links: Array.isArray(v.links) ? (v.links as UserPublicProfileConfigV1["links"]) : [],
    sections: Array.isArray(v.sections) ? (v.sections as UserPublicProfileConfigV1["sections"]) : DEFAULT_CONFIG.sections,
  };
};

export default function AdminSettingsAccountPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const profile = useQuery(
    api.viewer.queries.getViewerProfile,
    shouldQuery ? {} : "skip",
  ) as ViewerProfile | null | undefined;

  const updateProfile = useMutation(api.viewer.mutations.updateViewerProfile);

  const [name, setName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatarPickerOpen, setAvatarPickerOpen] = React.useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = React.useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = React.useState<string | null>(null);
  const [avatarMediaId, setAvatarMediaId] = React.useState<Id<"userMedia"> | null>(null);
  const [coverMediaId, setCoverMediaId] = React.useState<Id<"userMedia"> | null>(null);
  const [publicUsername, setPublicUsername] = React.useState("");
  const [draftConfig, setDraftConfig] = React.useState<UserPublicProfileConfigV1>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setBio(profile.bio ?? "");
    setAvatarMediaId(profile.avatarMediaId ?? null);
    setCoverMediaId(profile.coverMediaId ?? null);
    setAvatarPreviewUrl(profile.avatarUrl ?? null);
    setCoverPreviewUrl(profile.coverUrl ?? null);
    setPublicUsername(profile.publicUsername ?? "");
    setDraftConfig(normalizeConfig(profile.publicProfileConfig));
  }, [profile]);

  const canSave = shouldQuery && !isSaving;

  return (
    <div className="space-y-6">
      <UserPublicProfile
        mode="admin"
        canEdit={true}
        user={{
          _id: "me",
          publicUsername: slugifyUsername(publicUsername || name || (profile?.email?.split("@")[0] ?? "me")) || "me",
          displayName: name.trim() ? name : (profile?.email?.split("@")[0] ?? "Me"),
          bio,
          avatarUrl: avatarPreviewUrl,
          coverUrl: coverPreviewUrl,
          publicProfileConfig: draftConfig,
        }}
      />

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Set an avatar and cover image for your public profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Cover image</Label>
            <div className="relative overflow-hidden rounded-xl border bg-muted/10">
              <div className="relative h-40 w-full">
                {coverPreviewUrl ? (
                  <Image
                    src={coverPreviewUrl}
                    alt="Cover"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                ) : (
                  <div className="h-full w-full bg-linear-to-r from-orange-500/20 via-orange-500/10 to-transparent" />
                )}
              </div>
              <div className="absolute bottom-3 right-3 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setCoverPickerOpen(true)}>
                  Choose cover
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!coverMediaId && !coverPreviewUrl}
                  onClick={() => {
                    setCoverMediaId(null);
                    setCoverPreviewUrl(null);
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="text-muted-foreground text-xs">
              Uses your user-scoped media library.
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl border bg-muted/10">
                {avatarPreviewUrl ? (
                  <Image
                    src={avatarPreviewUrl}
                    alt="Avatar"
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                    {(name.trim() ? name : (profile?.email ?? "U")).slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="font-medium">Avatar</div>
                <div className="text-muted-foreground text-xs">Shown on your public profile.</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setAvatarPickerOpen(true)}>
                Choose avatar
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!avatarMediaId && !avatarPreviewUrl}
                onClick={() => {
                  setAvatarMediaId(null);
                  setAvatarPreviewUrl(null);
                }}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                placeholder="Enter your display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email ?? ""} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Trading bio</Label>
            <Input
              id="bio"
              placeholder="Tell us about your trading style..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t px-6 py-4">
          <Button
            disabled={!canSave}
            onClick={async () => {
              setIsSaving(true);
              try {
                await updateProfile({
                  name,
                  bio,
                  publicUsername: publicUsername.trim() ? publicUsername.trim() : null,
                  avatarMediaId,
                  coverMediaId,
                  publicProfileConfig: draftConfig,
                });
              } finally {
                setIsSaving(false);
              }
            }}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Public profile page</CardTitle>
          <CardDescription>
            Customize what shows on your public profile: sections, order, and links.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="publicUsername">Public username</Label>
            <Input
              id="publicUsername"
              placeholder="e.g. kairo-fx"
              value={publicUsername}
              onChange={(e) => setPublicUsername(e.target.value)}
            />
            <div className="text-muted-foreground text-xs">
              This controls your URL at <span className="font-mono">/u/&lt;username&gt;</span>.
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">Sections</div>
            <div className="space-y-2">
              {draftConfig.sections.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/10 px-3 py-2"
                >
                  <div className="min-w-[120px] text-sm font-medium">{s.kind}</div>
                  <Switch
                    checked={s.enabled}
                    onCheckedChange={(checked) => {
                      setDraftConfig((prev) => ({
                        ...prev,
                        sections: prev.sections.map((x) =>
                          x.id === s.id ? { ...x, enabled: Boolean(checked) } : x,
                        ),
                      }));
                    }}
                  />
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={idx === 0}
                      onClick={() =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          sections: moveItem(prev.sections, idx, idx - 1),
                        }))
                      }
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={idx === draftConfig.sections.length - 1}
                      onClick={() =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          sections: moveItem(prev.sections, idx, idx + 1),
                        }))
                      }
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Links</div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    links: [...prev.links, { label: "", url: "" }],
                  }))
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add link
              </Button>
            </div>

            <div className="space-y-2">
              {draftConfig.links.map((l, idx) => (
                <div key={idx} className="rounded-xl border bg-muted/10 p-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground">Label</Label>
                      <Input
                        value={l.label}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDraftConfig((prev) => ({
                            ...prev,
                            links: prev.links.map((x, i) => (i === idx ? { ...x, label: value } : x)),
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground">URL</Label>
                      <Input
                        value={l.url}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDraftConfig((prev) => ({
                            ...prev,
                            links: prev.links.map((x, i) => (i === idx ? { ...x, url: value } : x)),
                          }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={idx === 0}
                      onClick={() =>
                        setDraftConfig((prev) => ({ ...prev, links: moveItem(prev.links, idx, idx - 1) }))
                      }
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={idx === draftConfig.links.length - 1}
                      onClick={() =>
                        setDraftConfig((prev) => ({ ...prev, links: moveItem(prev.links, idx, idx + 1) }))
                      }
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          links: prev.links.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <MediaLibraryDialog<
        { limit?: number },
        Record<string, never>,
        { storageId: string; contentType: string; size: number; filename?: string },
        UserMediaRow
      >
        open={avatarPickerOpen}
        onOpenChange={setAvatarPickerOpen}
        title="Your media"
        listRef={api.userMedia.listMyUserMedia}
        listArgs={{ limit: 200 }}
        generateUploadUrlRef={api.userMedia.generateUserMediaUploadUrl}
        uploadArgs={{}}
        createRef={api.userMedia.createUserMedia}
        buildCreateArgs={({ storageId, file }) => ({
          storageId,
          contentType: file.type || "application/octet-stream",
          size: file.size,
          filename: file.name,
        })}
        onSelect={(item) => {
          setAvatarMediaId(item._id);
          setAvatarPreviewUrl(item.url);
        }}
      />

      <MediaLibraryDialog<
        { limit?: number },
        Record<string, never>,
        { storageId: string; contentType: string; size: number; filename?: string },
        UserMediaRow
      >
        open={coverPickerOpen}
        onOpenChange={setCoverPickerOpen}
        title="Your media"
        listRef={api.userMedia.listMyUserMedia}
        listArgs={{ limit: 200 }}
        generateUploadUrlRef={api.userMedia.generateUserMediaUploadUrl}
        uploadArgs={{}}
        createRef={api.userMedia.createUserMedia}
        buildCreateArgs={({ storageId, file }) => ({
          storageId,
          contentType: file.type || "application/octet-stream",
          size: file.size,
          filename: file.name,
        })}
        onSelect={(item) => {
          setCoverMediaId(item._id);
          setCoverPreviewUrl(item.url);
        }}
      />
    </div>
  );
}

