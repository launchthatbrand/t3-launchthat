"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";

export default function PlatformUserIndexPage() {
  const router = useRouter();
  const params = useParams<{ userId?: string | string[] }>();
  const raw = params.userId;
  const userId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  React.useEffect(() => {
    if (!userId) return;
    router.replace(`/platform/user/${encodeURIComponent(userId)}/general`);
  }, [router, userId]);

  return null;
}
