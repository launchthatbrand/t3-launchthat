import type { LabelFunction, StaticLabel } from "@convexcms/core";

export type StepNavItem = {
  label: LabelFunction | StaticLabel;
  url?: string;
};

export type ContextType = {
  setStepNav: (items: StepNavItem[]) => void;
  stepNav: StepNavItem[];
};
