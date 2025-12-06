"use client";

import type { ReactNode } from "react";
import { registerFrontendFilter } from "launchthat-plugin-core/frontendFilters";

import { LinearProgressContentGate } from "./LinearProgressContentGate";

const FILTER_ID = "lms-linear-progress-content-guard";

registerFrontendFilter({
  id: FILTER_ID,
  location: "content",
  handler: (children: ReactNode) => (
    <LinearProgressContentGate>{children}</LinearProgressContentGate>
  ),
});
