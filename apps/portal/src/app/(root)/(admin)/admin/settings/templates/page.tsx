"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Button } from "@acme/ui/button";

import { PageTemplatesManager } from "~/components/admin/templates/PageTemplatesManager";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <section>
        <PageTemplatesManager />
      </section>
    </div>
  );
}
