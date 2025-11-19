"use client";

import type { Data } from "@measured/puck";
import { Render } from "@measured/puck";
import { puckConfig } from "./config/puck-config";

interface PuckContentRendererProps {
  data: Data;
}

export function PuckContentRenderer({ data }: PuckContentRendererProps) {
  if (!data.content.length) {
    return null;
  }
  return (
    <div className="puck-content space-y-4">
      <Render config={puckConfig} data={data} />
    </div>
  );
}
