"use client";

import type {
  TemplateData,
  TemplateStorage,
} from "@acme/puck-config/blocks/Template";
import { walkTree, type Data, type Slot } from "@measured/puck";
import type { ConvexReactClient } from "convex/react";
import { generateId } from "@acme/puck-config/core/lib/generate-id";
import { api, type PublicApiType } from "../../../portal/convexspec";
import type { Id } from "../../../portal/convex/_generated/dataModel";
import { puckConfig } from "@acme/puck-config";

type TemplateListItem = {
  _id: string;
  title: string;
  content?: string | null;
  puckData?: string | null;
  pageIdentifier: string;
};

const ensureBlankEntry = (record: TemplateData): TemplateData => {
  if (!record.blank) {
    record.blank = {
      label: "Blank",
      data: [],
    };
  }
  return record;
};

const cloneSlot = (content: Slot): Slot =>
  ((content as Slot).map((child) =>
    walkTree(
      child as any,
      puckConfig,
      (items) =>
        items.map((item) => ({
          ...item,
          props: { ...item.props, id: generateId(item.type) },
        })),
    ) as any,
  ) as unknown) as Slot;

const parsePuckData = (raw: unknown): Slot => {
  if (!raw) return [];
  try {
    const parsed: Data =
      typeof raw === "string" ? (JSON.parse(raw) as Data) : (raw as Data);
    if (Array.isArray(parsed?.content)) {
      return cloneSlot(parsed.content as Slot);
    }
  } catch (error) {
    console.error("Failed to parse template data", error);
  }
  return [];
};

export const createConvexTemplateStorage = ({
  convex,
  scopeKey,
}: {
  convex: ConvexReactClient;
  scopeKey: string;
}): TemplateStorage => {
  let cache: TemplateData = {};

  return {
    async load() {
      const organizationId =
        scopeKey !== "global" ? (scopeKey as Id<"organizations">) : undefined;
      const templates =
        ((await convex.query(api.core.posts.queries.listTemplates, {
          ...(organizationId ? { organizationId } : {}),
        })) as TemplateListItem[] | undefined) ?? [];

      const entries = await Promise.all(
        templates.map(async (template) => {
          const raw = template.puckData ?? template.content ?? null;
          const data = parsePuckData(raw);
          return [
            template._id,
            {
              label: template.title,
              data,
            },
          ] as const;
        }),
      );

      cache = ensureBlankEntry(
        entries.reduce<TemplateData>((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {}),
      );

      return cache;
    },
    async save(record) {
      cache = record;
    },
  };
};

