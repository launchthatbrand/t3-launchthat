import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";

export type MetaValue = string | number | boolean | null;

type Ctx = QueryCtx | MutationCtx;

export const CALENDAR_POST_TYPE = "calendars";
export const EVENT_POST_TYPE = "events";

export type CalendarOwnerType = "user" | "group" | "course" | "organization";

export const CALENDAR_META_KEYS = {
  color: "calendar:color",
  ownerId: "calendar:ownerId",
  ownerType: "calendar:ownerType",
  isDefault: "calendar:isDefault",
  isPublic: "calendar:isPublic",
} as const;

export const EVENT_META_KEYS = {
  calendarId: "event:calendarId",
  startTime: "event:startTime",
  endTime: "event:endTime",
  allDay: "event:allDay",
  timezone: "event:timezone",
  type: "event:type",
  visibility: "event:visibility",
  location: "event:location",
  recurrence: "event:recurrence",
  color: "event:color",
  createdBy: "event:createdBy",
} as const;

export type CalendarRecord = {
  _id: Id<"posts">;
  title: string;
  name: string;
  description?: string | null;
  color?: string | null;
  ownerId?: string | null;
  ownerType?: CalendarOwnerType;
  isDefault?: boolean;
  isPublic?: boolean;
  organizationId?: Id<"organizations"> | null;
  slug?: string | null;
};

export type EventLocation = {
  type: "virtual" | "physical" | "hybrid";
  address?: string;
  url?: string;
  meetingId?: string;
  passcode?: string;
};

export type EventRecurrence = {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number;
  count?: number;
  until?: number;
  byDay?: string[];
  byMonthDay?: number[];
  byMonth?: number[];
};

export type EventRecord = {
  _id: Id<"posts">;
  title: string;
  description?: string | null;
  calendarId?: Id<"posts">;
  startTime?: number;
  endTime?: number;
  allDay?: boolean;
  timezone?: string | null;
  type?: string | null;
  visibility?: string | null;
  color?: string | null;
  createdBy?: string | null;
  location?: EventLocation;
  recurrence?: EventRecurrence;
  organizationId?: Id<"organizations"> | null;
  slug?: string | null;
};

export async function getPostMetaMap(
  ctx: Ctx,
  postId: Id<"posts">,
): Promise<Map<string, MetaValue>> {
  const metaEntries = await ctx.db
    .query("postsMeta")
    .withIndex("by_post", (q) => q.eq("postId", postId))
    .collect();

  return new Map(
    metaEntries.map((entry) => [entry.key, entry.value ?? null] as const),
  );
}

export async function setPostMetaValue(
  ctx: MutationCtx,
  postId: Id<"posts">,
  key: string,
  value: MetaValue,
): Promise<void> {
  const existing = await ctx.db
    .query("postsMeta")
    .withIndex("by_post_and_key", (q) => q.eq("postId", postId).eq("key", key))
    .unique();

  const timestamp = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, { value, updatedAt: timestamp });
    return;
  }

  await ctx.db.insert("postsMeta", {
    postId,
    key,
    value,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function deletePostMetaKey(
  ctx: MutationCtx,
  postId: Id<"posts">,
  key: string,
): Promise<void> {
  const existing = await ctx.db
    .query("postsMeta")
    .withIndex("by_post_and_key", (q) => q.eq("postId", postId).eq("key", key))
    .unique();

  if (existing) {
    await ctx.db.delete(existing._id);
  }
}

const toNumber = (value: MetaValue): number | undefined =>
  typeof value === "number" ? value : undefined;

const toBoolean = (value: MetaValue): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const toStringValue = (value: MetaValue): string | undefined =>
  typeof value === "string" ? value : undefined;

const parseJsonMeta = <T>(value: MetaValue): T | undefined => {
  const raw = toStringValue(value);
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
};

export const serializeJsonMeta = (value: unknown): string =>
  JSON.stringify(value ?? null);

export const hydrateCalendar = (
  post: Doc<"posts">,
  meta: Map<string, MetaValue>,
): CalendarRecord => ({
  _id: post._id,
  title: post.title,
  name: post.title,
  description: post.content,
  color: toStringValue(meta.get(CALENDAR_META_KEYS.color)),
  ownerId: toStringValue(meta.get(CALENDAR_META_KEYS.ownerId)),
  ownerType: toStringValue(meta.get(CALENDAR_META_KEYS.ownerType)) as
    | CalendarOwnerType
    | undefined,
  isDefault: toBoolean(meta.get(CALENDAR_META_KEYS.isDefault)),
  isPublic: toBoolean(meta.get(CALENDAR_META_KEYS.isPublic)),
  organizationId: post.organizationId ?? undefined,
  slug: post.slug ?? undefined,
});

export const hydrateEvent = (
  post: Doc<"posts">,
  meta: Map<string, MetaValue>,
): EventRecord => ({
  _id: post._id,
  title: post.title,
  description: post.content,
  calendarId: toStringValue(meta.get(EVENT_META_KEYS.calendarId)) as
    | Id<"posts">
    | undefined,
  startTime: toNumber(meta.get(EVENT_META_KEYS.startTime)),
  endTime: toNumber(meta.get(EVENT_META_KEYS.endTime)),
  allDay: toBoolean(meta.get(EVENT_META_KEYS.allDay)),
  timezone: toStringValue(meta.get(EVENT_META_KEYS.timezone)),
  type: toStringValue(meta.get(EVENT_META_KEYS.type)),
  visibility: toStringValue(meta.get(EVENT_META_KEYS.visibility)),
  color: toStringValue(meta.get(EVENT_META_KEYS.color)),
  createdBy: toStringValue(meta.get(EVENT_META_KEYS.createdBy)),
  location: parseJsonMeta<EventLocation>(meta.get(EVENT_META_KEYS.location)),
  recurrence: parseJsonMeta<EventRecurrence>(
    meta.get(EVENT_META_KEYS.recurrence),
  ),
  organizationId: post.organizationId ?? undefined,
  slug: post.slug ?? undefined,
});

export const getCalendarViewDateRange = (
  viewDate: Date,
  viewType: "day" | "week" | "month" | "year",
): { start: number; end: number } => {
  const startDate = new Date(viewDate);
  const endDate = new Date(viewDate);
  startDate.setHours(0, 0, 0, 0);

  switch (viewType) {
    case "day": {
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case "week": {
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case "month": {
      startDate.setDate(1);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case "year": {
      startDate.setMonth(0, 1);
      endDate.setMonth(11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
  }

  return {
    start: startDate.getTime(),
    end: endDate.getTime(),
  };
};

export async function deleteAllMetaForPost(
  ctx: MutationCtx,
  postId: Id<"posts">,
) {
  const entries = await ctx.db
    .query("postsMeta")
    .withIndex("by_post", (q) => q.eq("postId", postId))
    .collect();

  await Promise.all(entries.map((entry) => ctx.db.delete(entry._id)));
}
