import type { Ref } from "react";

export type CardType =
  | "post"
  | "group"
  | "download"
  | "template"
  | "post-format"
  | "button"
  | "calltoaction"
  | "user";

export type ColumnValue = "1" | "2" | "3" | "4" | "5" | "6";
export type GapValue = "0" | "2" | "4" | "6" | "8";

export type CardTypeOption = { label: string; value: CardType };
export type ColumnOption = { label: string; value: ColumnValue };
export type GapOption = { label: string; value: GapValue };

export interface LoopGridItem {
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string | null;
  link?: string | null;
  [key: string]: unknown;
}

export interface LoopGridProps {
  dataSource?: string;
  cardType: CardType;
  templateId?: string | null;
  columns: ColumnValue;
  gap: GapValue;
  enableViewToggle: boolean;
  items?: LoopGridItem[];
  puck?: {
    dragRef?: Ref<HTMLDivElement>;
  };
  [key: string]: unknown;
}

export interface LoopGridRendererProps extends LoopGridProps {
  resolvedItems: LoopGridItem[];
  isLoading: boolean;
  error: string | null;
}

export interface UseLoopGridDataResult {
  items: LoopGridItem[];
  loading: boolean;
  error: string | null;
}

