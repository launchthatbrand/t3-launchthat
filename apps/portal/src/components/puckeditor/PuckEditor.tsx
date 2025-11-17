"use client";

import "@measured/puck/puck.css";

import type { Data } from "@measured/puck";
import React, { Suspense } from "react";
import { usePuckDynamicData } from "@/hooks/usePuckDynamicData";
import { usePuckConfigStore } from "@/src/store/puckConfigStore";
import { Puck } from "@measured/puck";

interface PuckEditorProps {
  initialData?: Data;
  onPublish?: (data: Data) => void;
  readOnly?: boolean;
}

/**
 * A centralized Puck editor component that handles all dynamic configuration
 * This component automatically handles options for entity selectors (groups, etc.)
 */
function PuckEditorInner({
  initialData = { content: [], root: {} },
  onPublish,
  readOnly = false,
}: PuckEditorProps) {
  // Load dynamic data for selectors
  usePuckDynamicData();

  // Get the enhanced config with all dynamic options
  const enhancedConfig = usePuckConfigStore((state) =>
    state.getEnhancedConfig(),
  );

  return (
    <Puck
      config={enhancedConfig}
      data={initialData}
      onPublish={onPublish}
      readOnly={readOnly}
    />
  );
}

export function PuckEditor(props: PuckEditorProps) {
  return (
    <Suspense fallback={<div>Loading editor…</div>}>
      <PuckEditorInner {...props} />
    </Suspense>
  );
}

/**
 * A render-only component for displaying Puck pages
 */
function PuckRendererInner({ data }: { data: Data }) {
  // Load dynamic data for selectors
  usePuckDynamicData();

  // Get the enhanced config with all dynamic options
  const enhancedConfig = usePuckConfigStore((state) =>
    state.getEnhancedConfig(),
  );

  return (
    <div className="puck-content">
      <Puck.Render config={enhancedConfig} data={data} />
    </div>
  );
}

export function PuckRenderer(props: { data: Data }) {
  return (
    <Suspense fallback={<div>Loading content…</div>}>
      <PuckRendererInner {...props} />
    </Suspense>
  );
}
