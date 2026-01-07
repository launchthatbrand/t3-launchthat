import type { Doc } from "../../_generated/dataModel";

export type DownloadDoc = Doc<"downloads">;

export interface ViewerContext {
  isAuthenticated: boolean;
}

/**
 * Central policy engine entrypoint. Keep this stable and extend by composing
 * additional checks/adapters (LMS, commerce, roles) over time.
 */
export function canAccessDownload(
  download: DownloadDoc,
  viewer: ViewerContext,
): boolean {
  if (download.access.kind === "public") {
    return true;
  }

  // v1 policy for gated downloads: require authentication.
  // Later: plug in LMS enrollment, commerce entitlements, roles, etc.
  return viewer.isAuthenticated;
}


