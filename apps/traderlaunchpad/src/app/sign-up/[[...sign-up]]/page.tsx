"use client";

import * as React from "react";

import { useRouter, useSearchParams } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinCode =
    searchParams.get("join")?.trim() ?? searchParams.get("code")?.trim() ?? "";

  React.useEffect(() => {
    const target = joinCode
      ? `/sign-in?join=${encodeURIComponent(joinCode)}`
      : "/sign-in";
    router.replace(target);
  }, [joinCode, router]);

  return null;
}


