"use client";

import SharedAnalyticsReportPage from "../../../../../a/[shareToken]/page";

export default function PublicUserSharedAnalyticsReportPage() {
  // NOTE: We intentionally do not validate username here.
  // The report is token-gated (shareToken) and the /u/:username prefix is purely UX/branding.
  // SharedAnalyticsReportPage reads shareToken from useParams().
  return <SharedAnalyticsReportPage />;
}

