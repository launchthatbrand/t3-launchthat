"use client";

import { useSearchParams } from "next/navigation";
import { WordPressIntegrationManager } from "@/components/integrations/wordpress/WordPressIntegrationManager";

export default function WordPressIntegrationPage() {
  // Get connection ID from URL query parameters
  const searchParams = useSearchParams();
  const connectionId = searchParams.get("id");

  return (
    <div className="container py-10">
      <WordPressIntegrationManager
        connectionId={connectionId || undefined}
        defaultTab="overview"
      />
    </div>
  );
}
