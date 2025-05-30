import type { OptionObject } from "@convexcms/core";

export type Props = {
  onChange: (options: OptionObject[]) => void;
  options: OptionObject[];
  value: OptionObject[];
};
