"use client";

import { Button } from "@acme/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { PageTemplatesManager } from "~/components/admin/templates/PageTemplatesManager";

export default function TemplatesPage() {
  return (
    <div className="container space-y-6 py-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/settings">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Templates</h1>
        </div>
        <p className="text-muted-foreground">
          Manage reusable layouts for single entries, archives, loop items, and
          standalone sections powered by the Puck editor.
        </p>
      </header>

      <section>
        <PageTemplatesManager />
      </section>
    </div>
  );
}
