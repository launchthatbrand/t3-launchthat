"use client";

import "./index.scss";

import type {
  DefaultCellComponentProps,
  JSONFieldClient,
} from "@convexcms/core";
import React from "react";

export const JSONCell: React.FC<DefaultCellComponentProps<JSONFieldClient>> = ({
  cellData,
}) => {
  const textToShow =
    cellData?.length > 100 ? `${cellData.substring(0, 100)}\u2026` : cellData;

  return (
    <code className="json-cell">
      <span>{JSON.stringify(textToShow)}</span>
    </code>
  );
};
