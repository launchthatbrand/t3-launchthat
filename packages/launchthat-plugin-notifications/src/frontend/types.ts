import type * as React from "react";

/**
 * Matches the Portal notifications table `tabKey` usage.
 * - Portal: tabs are driven by "active org" + plugin-injected tabs.
 * - TraderLaunchpad: tabs are fixed: All/System/Organizations.
 */
export interface NotificationTabDefinition {
  id: string;
  label: string;
  /**
   * Matches `notifications.tabKey` in Convex.
   * If omitted, the tab is treated as "All".
   */
  tabKey?: string;
}

export type NotificationsInboxMode = "activeOrgOnly" | "allOrgs";

/**
 * Minimal shape of a notification record as consumed by the shared UI.
 * We keep this intentionally loose so apps can evolve schema without breaking the UI package.
 */
export type NotificationRow = Record<string, unknown> & {
  _id: string;
  createdAt?: number;
  read?: boolean;
  title?: string;
  content?: string | null;
  actionUrl?: string | null;
  tabKey?: string | null;
  eventKey?: string | null;
  orgId?: unknown;
};

export type NotificationsPaginationResult = {
  page: Array<NotificationRow>;
  isDone: boolean;
  continueCursor: string | null;
};

export type NotificationsAdapter = {
  /**
   * Selects inbox behavior:
   * - activeOrgOnly: portal-style (only show notifications for the currently selected org)
   * - allOrgs: traderlaunchpad-style (show notifications across all orgs)
   */
  inboxMode: NotificationsInboxMode;

  /**
   * Tabs to show. Portal can pre-apply plugin filters and pass the final list.
   */
  tabs: Array<NotificationTabDefinition>;

  /**
   * Convex function references (kept as `any` to avoid forcing every consumer
   * to share a single generated `api` type).
   */
  api: {
    queries: {
      /**
       * Paginated notifications query.
       * - Portal: `api.core.notifications.queries.paginateByClerkIdAndOrgId`
       * - TraderLaunchpad: `api.notifications.queries.paginateByClerkIdAcrossOrgs` (new)
       */
      paginate: any;

      /**
       * Optional: unread count query for header badge.
       */
      unreadCount?: any;

      /**
       * Optional: query to resolve the Convex user doc.
       * Portal uses this to get `userId` for mark-all mutation.
       */
      getUserByClerkId?: any;
    };

    mutations: {
      markAsRead: any;
      markAllAsRead: any;
    };
  };

  /**
   * Build args for the `paginate` query. Returning `"skip"` prevents calling Convex.
   */
  buildPaginateArgs: (args: {
    clerkId?: string | null;
    /** Active org id (Portal). Ignored for all-org inbox. */
    orgId?: string | null;
    tabKey?: string;
    cursor: string | null;
    numItems: number;
  }) => Record<string, unknown> | "skip";

  /**
   * Build args for the `markAllAsRead` mutation. Return null to disable.
   * This indirection lets Portal use `{ userId, orgId }` while TraderLaunchpad
   * can use `{ clerkId }` or `{ userId }` depending on backend shape.
   */
  buildMarkAllArgs: (args: {
    clerkId?: string | null;
    orgId?: string | null;
    /**
     * Convex user row returned by `getUserByClerkId` if used.
     * (Kept as unknown for adapter flexibility.)
     */
    convexUser?: unknown;
  }) => Record<string, unknown> | null;
};

export type NotificationsDropdownProps = {
  adapter: NotificationsAdapter;
  clerkId?: string | null;
  orgId?: string | null;
  onClose?: () => void;
  error?: string | null;
  variant?: "dropdown" | "drawer";
  headerRightSlot?: React.ReactNode;
};

