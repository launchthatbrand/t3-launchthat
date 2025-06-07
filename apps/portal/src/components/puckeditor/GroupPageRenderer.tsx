"use client";

import type { Data } from "@measured/puck";
import React from "react";
import { Render } from "@measured/puck";

import { config } from "./config/puck-config";

interface GroupPageRendererProps {
  data: Data;
}

export function GroupPageRenderer({ data }: GroupPageRendererProps) {
  return (
    <div className="group-page-content">
      <Render config={config} data={data} />
    </div>
  );
}
