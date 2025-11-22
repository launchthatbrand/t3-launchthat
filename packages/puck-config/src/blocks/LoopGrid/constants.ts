import type { CardTypeOption, ColumnOption, GapOption } from "./types.ts";

export const CARD_TYPE_OPTIONS: CardTypeOption[] = [
  { label: "Post", value: "post" },
  { label: "Group", value: "group" },
  { label: "Download", value: "download" },
  { label: "Template", value: "template" },
  { label: "Post Format", value: "post-format" },
  { label: "Button", value: "button" },
  { label: "Call To Action", value: "calltoaction" },
  { label: "User", value: "user" },
];

export const COLUMN_OPTIONS: ColumnOption[] = [
  { label: "1 Column", value: "1" },
  { label: "2 Columns", value: "2" },
  { label: "3 Columns", value: "3" },
  { label: "4 Columns", value: "4" },
  { label: "5 Columns", value: "5" },
  { label: "6 Columns", value: "6" },
];

export const GAP_OPTIONS: GapOption[] = [
  { label: "None", value: "0" },
  { label: "Small", value: "2" },
  { label: "Medium", value: "4" },
  { label: "Large", value: "6" },
  { label: "Extra Large", value: "8" },
];

export const DEFAULT_ITEMS = [
  {
    id: "loop-placeholder-1",
    title: "Sample Item One",
    description: "Replace this data by choosing a data source.",
    link: "#",
  },
  {
    id: "loop-placeholder-2",
    title: "Sample Item Two",
    description: "Configure Loop Grid to see real content.",
    link: "#",
  },
  {
    id: "loop-placeholder-3",
    title: "Sample Item Three",
    description: "Each data source can power a unique layout.",
    link: "#",
  },
];

