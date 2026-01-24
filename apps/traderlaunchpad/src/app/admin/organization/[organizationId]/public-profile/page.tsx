"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { api } from "@convex-config/_generated/api";
import { Switch } from "~/components/ui/switch";
import { OrgPublicProfile, type OrgPublicProfileConfigV1 } from "~/components/publicProfiles/OrgPublicProfile";

interface OrgRow {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl: string | null;
  publicProfileConfig?: unknown;
}

const DEFAULT_CONFIG: OrgPublicProfileConfigV1 = {
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

const normalizeConfig = (raw: unknown): OrgPublicProfileConfigV1 => {
  if (!raw || typeof raw !== "object") return DEFAULT_CONFIG;
  const v = raw as Partial<OrgPublicProfileConfigV1>;
  if (v.version !== "v1") return DEFAULT_CONFIG;
  return {
    version: "v1",
    links: Array.isArray(v.links) ? (v.links as OrgPublicProfileConfigV1["links"]) : [],
    sections: Array.isArray(v.sections) ? (v.sections as OrgPublicProfileConfigV1["sections"]) : DEFAULT_CONFIG.sections,
  };
};

export default function AdminOrgPublicProfilePage() {
  const params = useParams<{ organizationId?: string | string[] }>();
  const raw = params.organizationId;
  const organizationId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const myOrganizations = useQuery(
    api.coreTenant.organizations.myOrganizations,
    shouldQuery ? {} : "skip",
  ) as { _id: string; userRole: string }[] | undefined;

  const myRole =
    myOrganizations?.find((o) => String(o._id) === String(organizationId))?.userRole ?? "";
  const canEdit = myRole === "owner" || myRole === "admin";

  const org = useQuery(
    api.coreTenant.organizations.getOrganizationById,
    shouldQuery && organizationId ? { organizationId } : "skip",
  ) as OrgRow | null | undefined;

  const saveConfig = useMutation(api.coreTenant.organizations.updateOrganizationPublicProfileConfig);

  const [draft, setDraft] = React.useState<OrgPublicProfileConfigV1>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!org) return;
    setDraft(normalizeConfig(org.publicProfileConfig));
  }, [org]);

  if (!org) return null;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-black/30 text-white backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base">Public profile settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="text-sm font-semibold text-white">Sections</div>
              <div className="space-y-2">
                {draft.sections.map((s, idx) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/3 px-3 py-2"
                  >
                    <div className="min-w-[120px] text-sm font-medium text-white/80">
                      {s.kind}
                    </div>
                    <Switch
                      checked={s.enabled}
                      disabled={!canEdit}
                      onCheckedChange={(checked) => {
                        setDraft((prev) => ({
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
                        disabled={!canEdit || idx === 0}
                        onClick={() => setDraft((prev) => ({ ...prev, sections: moveItem(prev.sections, idx, idx - 1) }))}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canEdit || idx === draft.sections.length - 1}
                        onClick={() => setDraft((prev) => ({ ...prev, sections: moveItem(prev.sections, idx, idx + 1) }))}
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
                <div className="text-sm font-semibold text-white">Links</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canEdit}
                  onClick={() =>
                    setDraft((prev) => ({
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
                {draft.links.map((l, idx) => (
                  <div key={idx} className="rounded-xl border border-white/10 bg-white/3 p-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-white/60">Label</Label>
                        <Input
                          value={l.label}
                          disabled={!canEdit}
                          onChange={(e) => {
                            const value = e.target.value;
                            setDraft((prev) => ({
                              ...prev,
                              links: prev.links.map((x, i) => (i === idx ? { ...x, label: value } : x)),
                            }));
                          }}
                          className="border-white/10 bg-black/40 text-white placeholder:text-white/40"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-white/60">URL</Label>
                        <Input
                          value={l.url}
                          disabled={!canEdit}
                          onChange={(e) => {
                            const value = e.target.value;
                            setDraft((prev) => ({
                              ...prev,
                              links: prev.links.map((x, i) => (i === idx ? { ...x, url: value } : x)),
                            }));
                          }}
                          className="border-white/10 bg-black/40 text-white placeholder:text-white/40"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canEdit || idx === 0}
                        onClick={() => setDraft((prev) => ({ ...prev, links: moveItem(prev.links, idx, idx - 1) }))}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canEdit || idx === draft.links.length - 1}
                        onClick={() => setDraft((prev) => ({ ...prev, links: moveItem(prev.links, idx, idx + 1) }))}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canEdit}
                        onClick={() =>
                          setDraft((prev) => ({
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

            <div className="flex justify-end">
              <Button
                disabled={!canEdit || isSaving}
                className="border-0 bg-orange-600 text-white hover:bg-orange-700"
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await saveConfig({ organizationId, config: draft });
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                {isSaving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="mb-2 text-sm font-semibold text-white/80">Preview</div>
          <OrgPublicProfile
            mode="admin"
            canEdit={canEdit}
            org={{
              _id: org._id,
              name: org.name,
              slug: org.slug,
              description: org.description,
              logoUrl: org.logoUrl,
              publicProfileConfig: draft,
            }}
          />
        </div>
      </div>
    </div>
  );
}

