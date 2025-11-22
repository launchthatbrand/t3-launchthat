"use client";

import { CARD_TYPE_OPTIONS, COLUMN_OPTIONS, DEFAULT_ITEMS, GAP_OPTIONS } from "./constants";
import { Grid3x3, List } from "lucide-react";
import { StyleWrapper, defaultStyleProps, styleFields } from "../../utils";
import { useMemo, useState } from "react";

import { Button } from "@acme/ui/button";
import type { ComponentConfig } from "@measured/puck";
import type { LoopGridProps } from "./types";
import { Skeleton } from "@acme/ui";
import { cardPlaceholderMap } from "./cards/PlaceholderCards";
import { dataSourceRegistry } from "../../plugins/dataSourceRegistry";
import { useLoopGridData } from "./useLoopGridData";

const columnClassMap: Record<string, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

const gapClassMap: Record<string, string> = {
  0: "gap-0",
  2: "gap-2",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
};

const VIEW_MODES = ["grid", "list"] as const;
type ViewMode = (typeof VIEW_MODES)[number];

const sharedStyleFields = styleFields as Record<string, any>;

const baseFields: Record<string, any> = {
  dataSource: {
    type: "select",
    label: "Data Source",
    options: dataSourceRegistry.getOptions(),
  },
  cardType: {
    type: "select",
    label: "Card Type",
    options: CARD_TYPE_OPTIONS,
  },
  templateId: {
    type: "text",
    label: "Template ID",
    placeholder: "Optional",
  },
  columns: {
    type: "select",
    label: "Columns",
    options: COLUMN_OPTIONS,
  },
  gap: {
    type: "select",
    label: "Gap",
    options: GAP_OPTIONS,
  },
  enableViewToggle: {
    type: "radio",
    label: "Enable View Toggle",
    options: [
      { label: "Yes", value: true },
      { label: "No", value: false },
    ],
  },
  ...sharedStyleFields,
};

const LoopGridRenderer = (props: LoopGridProps) => {
  const {
    puck,
    cardType,
    columns,
    gap,
    enableViewToggle,
    dataSource,
    templateId,
    items: initialItems,
    ...styleProps
  } = props;
  const { items, loading, error } = useLoopGridData(props);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const resolvedItems =
    items.length > 0
      ? items
      : initialItems && initialItems.length > 0
        ? (initialItems as typeof items)
        : DEFAULT_ITEMS;

  const CardComponent = cardPlaceholderMap[cardType] ?? cardPlaceholderMap.post;
  const columnClassName = columnClassMap[Number(columns)] ?? columnClassMap[3];
  const gapClassName = gapClassMap[Number(gap)] ?? gapClassMap[4];

  const showEmptyState = !loading && resolvedItems.length === 0;

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const toolbar = enableViewToggle && (
    <div className="mb-4 flex justify-end gap-2">
      <Button
        variant={viewMode === "grid" ? "primary" : "outline"}
        size="sm"
        onClick={() => handleViewChange("grid")}
      >
        <Grid3x3 className="mr-2 h-4 w-4" />
        Grid
      </Button>
      <Button
        variant={viewMode === "list" ? "primary" : "outline"}
        size="sm"
        onClick={() => handleViewChange("list")}
      >
        <List className="mr-2 h-4 w-4" />
        List
      </Button>
    </div>
  );

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      );
    }

    if (showEmptyState) {
      return (
        <div className="rounded border border-dashed border-muted-foreground/40 px-4 py-6 text-center text-sm text-muted-foreground">
          {dataSource
            ? "No items were returned by this data source."
            : "Select a data source to populate the grid."}
        </div>
      );
    }

    if (viewMode === "list") {
      return (
        <div className="space-y-3">
          {resolvedItems.map((item) => (
            <div
              key={item.id}
              className="rounded border border-muted-foreground/20 bg-card p-4 text-sm shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{item.title ?? "Untitled item"}</span>
                {item.link ? (
                  <a
                    className="text-primary hover:underline"
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Visit
                  </a>
                ) : null}
              </div>
              {item.description ? (
                <p className="mt-1 text-muted-foreground">{item.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className={`grid ${columnClassName} ${gapClassName}`}>
        {resolvedItems.map((item) => (
          <CardComponent key={item.id} item={item} />
        ))}
      </div>
    );
  }, [
    loading,
    error,
    showEmptyState,
    dataSource,
    viewMode,
    resolvedItems,
    columnClassName,
    gapClassName,
  ]);

  return (
    <StyleWrapper dragRef={puck?.dragRef} styleProps={styleProps}>
      {toolbar}
      {content}
      {templateId ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Template ID <code>{templateId}</code> is currently unused in the placeholder renderer.
        </p>
      ) : null}
    </StyleWrapper>
  );
};

export const LoopGrid: ComponentConfig<LoopGridProps> = {
  label: "Loop Grid",
  fields: baseFields,
  resolveFields: (data) => {
  const provider =
    data?.props?.dataSource && typeof data.props.dataSource === "string"
      ? dataSourceRegistry.get(data.props.dataSource)
      : undefined;

    if (provider?.getFields) {
      return {
      ...baseFields,
        ...provider.getFields(data),
      };
    }

    return baseFields;
  },
  defaultProps: {
    dataSource: "",
    cardType: "post",
    templateId: null,
    columns: "3",
    gap: "4",
    enableViewToggle: false,
    ...defaultStyleProps,
  },
  inline: true,
  render: (props) => <LoopGridRenderer {...props} />,
};

