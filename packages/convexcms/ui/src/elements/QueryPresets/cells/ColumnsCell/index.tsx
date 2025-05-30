import "./index.scss";

import type {
  ColumnPreference,
  DefaultCellComponentProps,
} from "@convexcms/core";
import React from "react";
import {
  toWords,
  transformColumnsToSearchParams,
} from "@convexcms/core/shared";

import { Pill } from "../../../Pill/index.js";

const baseClass = "query-preset-columns-cell";

export const QueryPresetsColumnsCell: React.FC<DefaultCellComponentProps> = ({
  cellData,
}) => {
  return (
    <div className={baseClass}>
      {cellData
        ? transformColumnsToSearchParams(cellData as ColumnPreference[]).map(
            (column, i) => {
              const isColumnActive = !column.startsWith("-");

              // to void very lengthy cells, only display the active columns
              if (!isColumnActive) {
                return null;
              }

              return (
                <Pill
                  key={i}
                  pillStyle={isColumnActive ? "always-white" : "light"}
                >
                  {toWords(column)}
                </Pill>
              );
            },
          )
        : "No columns selected"}
    </div>
  );
};
