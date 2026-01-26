"use client";

import React from "react";
import Image from "next/image";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
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
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = React.useState<string | null>(null);
  const [avatarMediaId, setAvatarMediaId] = React.useState<Id<"userMedia"> | null>(null);
  const [coverMediaId, setCoverMediaId] = React.useState<Id<"userMedia"> | null>(null);
  const [publicUsername, setPublicUsername] = React.useState("");
  const [draftConfig, setDraftConfig] = React.useState<UserPublicProfileConfigV1>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editNameOpen, setEditNameOpen] = React.useState(false);
  const [editBioOpen, setEditBioOpen] = React.useState(false);
  const [draftName, setDraftName] = React.useState("");
  const [draftBio, setDraftBio] = React.useState("");

  React.useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setBio(profile.bio ?? "");
    if (!editNameOpen) setDraftName(profile.name ?? "");
    if (!editBioOpen) setDraftBio(profile.bio ?? "");
    setAvatarMediaId(profile.avatarMediaId ?? null);
    setCoverMediaId(profile.coverMediaId ?? null);
    setAvatarPreviewUrl(profile.avatarUrl ?? null);
    setCoverPreviewUrl(profile.coverUrl ?? null);
    setPublicUsername(profile.publicUsername ?? "");
    setDraftConfig(normalizeConfig(profile.publicProfileConfig));
  }, [profile, editNameOpen, editBioOpen]);

  const canSave = shouldQuery && !isSaving;

  return (
    <div className="space-y-6">
      <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
        <DialogContent className="border-white/10 bg-background/90 text-foreground">
          <DialogHeader>
            <DialogTitle>Edit display name</DialogTitle>
          </DialogHeader>

          <label className="block text-sm text-foreground/70">
            Name
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Your display name"
            />
          </label>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full border-white/10 bg-white/5 text-foreground hover:bg-white/10"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="h-10 rounded-full border-0 bg-orange-600 text-foreground hover:bg-orange-700"
              onClick={() => {
                setName(draftName);
                setEditNameOpen(false);
              }}
              disabled={!draftName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editBioOpen} onOpenChange={setEditBioOpen}>
        <DialogContent className="border-white/10 bg-background/90 text-foreground">
          <DialogHeader>
            <DialogTitle>Edit bio</DialogTitle>
          </DialogHeader>

          <label className="block text-sm text-foreground/70">
            Trading bio
            <textarea
              className="mt-2 w-full rounded-xl border border-white/10 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40"
              rows={6}
              value={draftBio}
              onChange={(e) => setDraftBio(e.target.value)}
              placeholder="Tell us about your trading style..."
            />
          </label>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full border-white/10 bg-white/5 text-foreground hover:bg-white/10"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="h-10 rounded-full border-0 bg-orange-600 text-foreground hover:bg-orange-700"
              onClick={() => {
                setBio(draftBio);
                setEditBioOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserPublicProfile
        mode="admin"
        canEdit={true}
        onEditAvatarAction={() => setAvatarPickerOpen(true)}
        onEditNameAction={() => {
          setDraftName(name);
          setEditNameOpen(true);
        }}
        onEditBioAction={() => {
          setDraftBio(bio);
          setEditBioOpen(true);
        }}
        onChangeConfigAction={(next) => setDraftConfig(next)}
        isSaving={isSaving}
        onSaveAction={async () => {
          if (!canSave) return;
          setIsSaving(true);
          try {
            await updateProfile({
              name,
              bio,
              avatarMediaId,
              coverMediaId,
              publicProfileConfig: draftConfig,
            });
          } finally {
            setIsSaving(false);
          }
        }}
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
    </div>
  );
}

