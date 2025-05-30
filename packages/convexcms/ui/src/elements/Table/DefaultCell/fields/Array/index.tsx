"use client";

import type {
  ArrayFieldClient,
  DefaultCellComponentProps,
} from "@convexcms/core";
import React from "react";
import { getTranslation } from "@convexcms/translations";

import { useTranslation } from "../../../../../providers/Translation/index.js";

export interface ArrayCellProps
  extends DefaultCellComponentProps<ArrayFieldClient> {}

export const ArrayCell: React.FC<ArrayCellProps> = ({
  cellData,
  field: { labels },
}) => {
  const { i18n } = useTranslation();

  const arrayFields = cellData ?? [];

  const label =
    arrayFields.length === 1
      ? `${arrayFields.length} ${getTranslation(labels?.singular || i18n.t("general:rows"), i18n)}`
      : `${arrayFields.length} ${getTranslation(labels?.plural || i18n.t("general:rows"), i18n)}`;

  return <span>{label}</span>;
};
