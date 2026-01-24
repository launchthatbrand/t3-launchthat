import { v } from "convex/values";

export const orgPublicProfileSectionKindV1Validator = v.union(
  v.literal("hero"),
  v.literal("about"),
  v.literal("links"),
  v.literal("stats"),
);

export const orgPublicProfileLinkV1Validator = v.object({
  label: v.string(),
  url: v.string(),
});

export const orgPublicProfileSectionV1Validator = v.object({
  id: v.string(),
  kind: orgPublicProfileSectionKindV1Validator,
  enabled: v.boolean(),
});

export const orgPublicProfileConfigV1Validator = v.object({
  version: v.literal("v1"),
  links: v.array(orgPublicProfileLinkV1Validator),
  sections: v.array(orgPublicProfileSectionV1Validator),
});

export type OrgPublicProfileConfigV1 = {
  version: "v1";
  links: { label: string; url: string }[];
  sections: { id: string; kind: "hero" | "about" | "links" | "stats"; enabled: boolean }[];
};

export const DEFAULT_ORG_PUBLIC_PROFILE_CONFIG_V1: OrgPublicProfileConfigV1 = {
  version: "v1",
  links: [],
  sections: [
    { id: "hero", kind: "hero", enabled: true },
    { id: "about", kind: "about", enabled: true },
    { id: "links", kind: "links", enabled: true },
    { id: "stats", kind: "stats", enabled: true },
  ],
};

