import { v } from "convex/values";

export const userPublicProfileSectionKindV1Validator = v.union(
  v.literal("hero"),
  v.literal("about"),
  v.literal("links"),
  v.literal("stats"),
);

export const userPublicProfileLinkV1Validator = v.object({
  label: v.string(),
  url: v.string(),
});

export const userPublicProfileSectionV1Validator = v.object({
  id: v.string(),
  kind: userPublicProfileSectionKindV1Validator,
  enabled: v.boolean(),
});

export const userPublicProfileConfigV1Validator = v.object({
  version: v.literal("v1"),
  links: v.array(userPublicProfileLinkV1Validator),
  sections: v.array(userPublicProfileSectionV1Validator),
});

export interface UserPublicProfileConfigV1 {
  version: "v1";
  links: { label: string; url: string }[];
  sections: { id: string; kind: "hero" | "about" | "links" | "stats"; enabled: boolean }[];
}

export const DEFAULT_USER_PUBLIC_PROFILE_CONFIG_V1: UserPublicProfileConfigV1 = {
  version: "v1",
  links: [],
  sections: [
    { id: "hero", kind: "hero", enabled: true },
    { id: "about", kind: "about", enabled: true },
    { id: "links", kind: "links", enabled: true },
    { id: "stats", kind: "stats", enabled: true },
  ],
};

