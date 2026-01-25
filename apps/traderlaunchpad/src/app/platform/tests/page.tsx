"use client";

import React from "react";
import { BeakerIcon } from "lucide-react";

import { PlatformTestsClient } from "./PlatformTestsClient";

export default function PlatformTestsPage() {
  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="flex items-center gap-3">
        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-xl">
          <BeakerIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Tests</h1>
          <p className="text-muted-foreground mt-1">
            Internal test console for platform admins (preview + run).
          </p>
        </div>
      </div>

      <PlatformTestsClient />
    </div>
  );
}

