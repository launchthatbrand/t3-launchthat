import type { CardType, LoopGridItem } from "../types";

import React from "react";

type PlaceholderCardProps = {
  item: LoopGridItem;
};

const BasePlaceholderCard: React.FC<PlaceholderCardProps> = ({ item }) => (
  <div className="rounded-lg border border-border bg-card p-4 shadow-sm transition hover:shadow-md">
    <div className="mb-2 text-sm font-semibold text-muted-foreground">
      {item.id}
    </div>
    <h3 className="text-lg font-bold text-foreground">{item.title ?? "Untitled item"}</h3>
    {item.description ? (
      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
    ) : null}
    {item.link ? (
      <a
        className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
        href={item.link}
        target="_blank"
        rel="noreferrer"
      >
        Visit link →
      </a>
    ) : null}
  </div>
);

const ButtonPlaceholderCard: React.FC<PlaceholderCardProps> = ({ item }) => (
  <button className="flex w-full items-center justify-between rounded border border-dashed border-primary/60 bg-primary/5 px-4 py-3 text-left text-sm font-medium text-primary">
    <span>{item.title ?? "Button Label"}</span>
    <span className="text-xs text-primary/70">Placeholder</span>
  </button>
);

export const cardPlaceholderMap: Record<CardType, React.FC<PlaceholderCardProps>> = {
  post: BasePlaceholderCard,
  group: BasePlaceholderCard,
  download: BasePlaceholderCard,
  template: BasePlaceholderCard,
  "post-format": BasePlaceholderCard,
  button: ButtonPlaceholderCard,
  calltoaction: BasePlaceholderCard,
  user: BasePlaceholderCard,
};

