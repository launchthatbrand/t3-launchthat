import type { NumberFieldClient } from "@convexcms/core";

import type { DefaultFilterProps } from "../types.js";

export type Props = {
  readonly field: NumberFieldClient;
  readonly onChange: (e: string) => void;
  readonly value: string;
} & DefaultFilterProps;
