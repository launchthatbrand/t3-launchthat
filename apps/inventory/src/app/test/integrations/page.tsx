"use client";

import { IntegrationTest } from "@/components/test/IntegrationTest";

export default function IntegrationsTestPage() {
  return (
    <div className="container py-8">
      <h1 className="mb-6 text-center text-2xl font-bold">
        Integrations Module Test Page
      </h1>
      <IntegrationTest />
    </div>
  );
}
