import type { PluginDefinition } from "launchthat-plugin-core";
import { createElement } from "react";

import { DisclaimersIssueSendMetaBox } from "./admin/metaBoxes/DisclaimersIssueSendMetaBox";
import { DisclaimersTemplatePdfMetaBox } from "./admin/metaBoxes/DisclaimersTemplatePdfMetaBox";
import { DisclaimersOverviewPage } from "./admin/OverviewPage";
import { DisclaimersSettingsPage } from "./admin/SettingsPage";
import DisclaimerSignPage from "./frontend/DisclaimerSignPage";
import { DisclaimerTemplateBuilderTab } from "./tabs/DisclaimerTemplateBuilderTab";

export const PLUGIN_ID = "disclaimers" as const;
export type PluginId = typeof PLUGIN_ID;

export type CreateDisclaimersPluginDefinitionOptions = Record<string, never>;

const defaultOptions: CreateDisclaimersPluginDefinitionOptions = {};

const DISCLAIMERS_COMPONENT_TABLES = [
  "launchthat_disclaimers:posts",
  "launchthat_disclaimers:postsMeta",
];

const normalizePostLike = (value: unknown, fallbackPostTypeSlug: string) => {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id = raw._id ?? raw.id;
  if (typeof id !== "string" || id.trim().length === 0) return null;
  const postTypeSlug =
    typeof raw.postTypeSlug === "string" && raw.postTypeSlug.trim().length > 0
      ? raw.postTypeSlug
      : fallbackPostTypeSlug;
  return { ...raw, _id: id, postTypeSlug };
};

export const createDisclaimersPluginDefinition = (
  _options: CreateDisclaimersPluginDefinitionOptions = defaultOptions,
): PluginDefinition => ({
  id: PLUGIN_ID,
  name: "Disclaimers",
  description: "Collect signed disclaimers from users.",
  longDescription:
    "Upload disclaimer PDFs, issue signing requests, and store signed evidence for compliance and chargeback defense.",
  features: [
    "Disclaimer template PDFs",
    "Manual issuing (name/email)",
    "Signature capture and signed PDF generation",
    "Audit metadata and download evidence",
  ],
  hooks: {
    filters: [
      {
        hook: "frontend.post.stores",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (value: any, ctx: any) => {
          const stores = Array.isArray(value) ? value : [];
          const enabledPluginIds = Array.isArray(ctx?.enabledPluginIds)
            ? (ctx.enabledPluginIds as string[])
            : [];
          if (!enabledPluginIds.includes(PLUGIN_ID)) {
            return stores;
          }

          const existing = stores.some(
            (s: any) => s?.id === "disclaimers:component-posts",
          );
          if (existing) return stores;

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const apiAny = ctx?.api as any;

          const store = {
            id: "disclaimers:component-posts",
            pluginId: PLUGIN_ID,
            priority: 0,
            postTypeSlugs: ["disclaimers", "disclaimertemplates"],
            getBySlug: async ({ ctx: storeCtx, postTypeSlug, slug }: any) => {
              const org = storeCtx.organizationId
                ? String(storeCtx.organizationId)
                : undefined;
              const post =
                (await storeCtx.fetchQuery(
                  apiAny.plugins.disclaimers.posts.queries.getPostBySlug,
                  {
                    slug,
                    organizationId: org,
                  },
                )) ?? null;
              return normalizePostLike(post, postTypeSlug);
            },
            getById: async ({ ctx: storeCtx, postTypeSlug, id }: any) => {
              const org = storeCtx.organizationId
                ? String(storeCtx.organizationId)
                : undefined;
              const post =
                (await storeCtx.fetchQuery(
                  apiAny.plugins.disclaimers.posts.queries.getPostById,
                  {
                    id,
                    organizationId: org,
                  },
                )) ?? null;
              return normalizePostLike(post, postTypeSlug);
            },
            list: async ({ ctx: storeCtx, postTypeSlug, filters }: any) => {
              const org = storeCtx.organizationId
                ? String(storeCtx.organizationId)
                : undefined;
              const posts =
                (await storeCtx.fetchQuery(
                  apiAny.plugins.disclaimers.posts.queries.getAllPosts,
                  {
                    organizationId: org,
                    filters: { ...(filters ?? {}), postTypeSlug },
                  },
                )) ?? [];
              return Array.isArray(posts)
                ? posts
                    .map((p) => normalizePostLike(p, postTypeSlug))
                    .filter(Boolean)
                : [];
            },
          };

          return [...stores, store];
        },
        priority: 10,
        acceptedArgs: 2,
      },
      {
        hook: "frontend.route.handlers",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (value: any, ctx: any) => {
          const handlers = Array.isArray(value) ? value : [];
          return [
            ...handlers,
            {
              id: "disclaimers:signing",
              // Run before core:single (10) so we can claim /disclaimer/:issueId when needed.
              priority: 5,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              resolve: async (routeCtx: any) => {
                const enabledPluginIds = Array.isArray(
                  routeCtx?.enabledPluginIds,
                )
                  ? (routeCtx.enabledPluginIds as string[])
                  : [];
                if (!enabledPluginIds.includes(PLUGIN_ID)) {
                  return null;
                }

                const segmentsRaw = Array.isArray(routeCtx?.segments)
                  ? (routeCtx.segments as unknown[])
                  : [];
                const segments = segmentsRaw
                  .map((s) => (typeof s === "string" ? s.trim() : ""))
                  .filter(Boolean);

                if (segments.length < 2) return null;
                const root = String(segments[0] ?? "");
                if (!(root === "disclaimer" || root === "disclaimers"))
                  return null;

                const issueIdOrSlug = String(segments[1] ?? "").trim();
                if (!issueIdOrSlug) return null;

                // If this looks like a real "disclaimers" post slug, allow core:single to render it
                // (via the PostStore registered above). Otherwise treat it as a signing issueId.
                if (root === "disclaimer") {
                  const fetchQuery = routeCtx?.fetchQuery;
                  const apiAny = routeCtx?.api;
                  if (typeof fetchQuery === "function" && apiAny) {
                    const orgIdRaw = routeCtx?.organizationId;
                    const organizationId =
                      typeof orgIdRaw === "string" ? orgIdRaw : undefined;
                    const maybePost = await fetchQuery(
                      apiAny.plugins.disclaimers.posts.queries.getPostBySlug,
                      {
                        slug: issueIdOrSlug,
                        organizationId,
                      },
                    );
                    if (
                      maybePost &&
                      typeof maybePost === "object" &&
                      "_id" in maybePost
                    ) {
                      return null;
                    }
                  }
                }

                return createElement(DisclaimerSignPage, {
                  issueId: issueIdOrSlug,
                });
              },
            },
          ];
        },
        priority: 10,
        acceptedArgs: 2,
      },
    ],
  },
  postStatuses: [
    {
      value: "sent",
      label: "Sent",
      description: "A signing request has been emailed but not yet signed.",
      postTypeSlugs: ["disclaimers"],
    },
    {
      value: "signed",
      label: "Signed",
      description: "This disclaimer has been completed and signed.",
      postTypeSlugs: ["disclaimers"],
    },
  ],
  postTypes: [
    {
      name: "Disclaimers",
      slug: "disclaimers",
      description: "Issued disclaimers (pending and completed).",
      isPublic: true,
      supports: {
        title: true,
        customFields: true,
        postMeta: true,
      },
      rewrite: { hasArchive: false, singleSlug: "disclaimer" },
      adminMenu: {
        enabled: true,
        label: "Disclaimers",
        icon: "FileSignature",
        position: 60,
      },
      pageTemplateSlug: "canvas",
      storageKind: "component",
      storageTables: DISCLAIMERS_COMPONENT_TABLES,
      storageComponent: "launchthat_disclaimers",
      includeTimestamps: true,
      metaBoxes: [
        {
          id: "disclaimers-issue-send",
          title: "Send Disclaimer",
          description:
            "Choose a template, enter a recipient, and email a signing request.",
          location: "sidebar",
          priority: 10,
          fieldKeys: [],
          rendererKey: "disclaimers.issue.send",
        },
      ],
      metaBoxRenderers: {
        "disclaimers.issue.send": DisclaimersIssueSendMetaBox,
      },
    },
    {
      name: "Disclaimer Templates",
      slug: "disclaimertemplates",
      description: "PDF templates that recipients must review and sign.",
      isPublic: true,
      supports: {
        title: true,
        customFields: true,
        postMeta: true,
      },
      rewrite: {
        hasArchive: false,
        singleSlug: "disclaimertemplate",
        withFront: true,
      },
      adminMenu: {
        enabled: true,
        label: "Templates",
        icon: "FileSignature",
        position: 61,
      },
      storageKind: "component",
      storageTables: DISCLAIMERS_COMPONENT_TABLES,
      storageComponent: "launchthat_disclaimers",
      includeTimestamps: true,
      metaBoxes: [
        {
          id: "disclaimers-template-pdf",
          title: "Template PDF",
          description:
            "Upload a PDF or choose one from the Media Library. Recipients will review and sign this document.",
          location: "sidebar",
          priority: 20,
          fieldKeys: [],
          rendererKey: "disclaimers.template.pdf",
        },
      ],
      metaBoxRenderers: {
        "disclaimers.template.pdf": DisclaimersTemplatePdfMetaBox,
      },
      singleView: {
        defaultTab: "edit",
        tabs: [
          {
            id: "edit",
            slug: "edit",
            label: "Edit",
            description: "Update the template details and metadata.",
            usesDefaultEditor: true,
          },
          {
            id: "builder",
            slug: "builder",
            label: "Builder",
            description:
              "Place signature fields on the PDF (multi-sign supported).",
            render: (props) =>
              createElement(DisclaimerTemplateBuilderTab, props),
          },
        ],
      },
    },
  ],
  activation: {
    optionKey: `plugin_${PLUGIN_ID}_enabled`,
    optionType: "site",
    defaultEnabled: false,
  },
  settingsPages: [
    {
      id: "disclaimers-overview",
      slug: "overview",
      label: "Overview",
      description: "Shortcuts to Disclaimers and Templates.",
      render: (props) => createElement(DisclaimersOverviewPage, props),
    },
    {
      id: "disclaimers-settings",
      slug: "settings",
      label: "Settings",
      description: "Configure defaults and behavior for disclaimers.",
      render: (props) => createElement(DisclaimersSettingsPage, props),
    },
  ],
});

export const disclaimersPlugin: PluginDefinition =
  createDisclaimersPluginDefinition();
