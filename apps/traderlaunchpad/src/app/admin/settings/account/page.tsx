"use client";

import React from "react";
import Image from "next/image";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { MediaLibraryDialog } from "launchthat-plugin-core-tenant/frontend";

import { api } from "@convex-config/_generated/api";

interface UserMediaRow {
  _id: string;
  url: string | null;
  filename?: string;
  contentType: string;
  createdAt: number;
}

interface ViewerProfile {
  email: string;
  name?: string;
  bio?: string;
  avatarMediaId?: string;
  coverMediaId?: string;
  avatarUrl?: string;
  coverUrl?: string;
}

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
  const [avatarMediaId, setAvatarMediaId] = React.useState<string | null>(null);
  const [coverMediaId, setCoverMediaId] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setBio(profile.bio ?? "");
    setAvatarMediaId(profile.avatarMediaId ?? null);
    setCoverMediaId(profile.coverMediaId ?? null);
    setAvatarPreviewUrl(profile.avatarUrl ?? null);
    setCoverPreviewUrl(profile.coverUrl ?? null);
  }, [profile]);

  const canSave = shouldQuery && !isSaving;

  return (
    <div className="space-y-6">
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
                    {(name || profile?.email || "U").slice(0, 1).toUpperCase()}
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
                  avatarMediaId,
                  coverMediaId,
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

