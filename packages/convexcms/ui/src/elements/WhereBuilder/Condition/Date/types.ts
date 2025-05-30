import type { DateFieldClient } from "@convexcms/core";

import type { DefaultFilterProps } from "../types.js";

export type Props = {
  readonly field: DateFieldClient;
  readonly value: Date | string;
} & DefaultFilterProps;
