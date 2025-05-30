"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { useEffect, useMemo, useState } from "react";
import { getTranslation } from "@convexcms/translations";
import { useIntersect } from "../../../../../hooks/useIntersect.js";
import { useConfig } from "../../../../../providers/Config/index.js";
import { useTranslation } from "../../../../../providers/Translation/index.js";
import { canUseDOM } from "../../../../../utilities/canUseDOM.js";
import { formatDocTitle } from "../../../../../utilities/formatDocTitle/index.js";
import { useListRelationships } from "../../../RelationshipProvider/index.js";
import { FileCell } from "../File/index.js";
const baseClass = "relationship-cell";
const totalToShow = 3;
export const RelationshipCell = ({
  cellData: cellDataFromProps,
  customCellProps: customCellContext,
  field,
  field: {
    label
  }
}) => {
  // conditionally extract relationTo both both relationship and join fields
  const relationTo = "relationTo" in field && field.relationTo || "collection" in field && field.collection;
  // conditionally extract docs from join fields
  const cellData = useMemo(() => {
    return "collection" in field ? cellDataFromProps?.docs : cellDataFromProps;
  }, [cellDataFromProps, field]);
  const {
    config,
    getEntityConfig
  } = useConfig();
  const {
    collections,
    routes
  } = config;
  const [intersectionRef, entry] = useIntersect();
  const [values, setValues] = useState([]);
  const {
    documents,
    getRelationships
  } = useListRelationships();
  const [hasRequested, setHasRequested] = useState(false);
  const {
    i18n,
    t
  } = useTranslation();
  const isAboveViewport = canUseDOM ? entry?.boundingClientRect?.top < window.innerHeight : false;
  useEffect(() => {
    if ((cellData || typeof cellData === "number") && isAboveViewport && !hasRequested) {
      const formattedValues = [];
      const arrayCellData = Array.isArray(cellData) ? cellData : [cellData];
      arrayCellData.slice(0, arrayCellData.length < totalToShow ? arrayCellData.length : totalToShow).forEach(cell => {
        if (typeof cell === "object" && "relationTo" in cell && "value" in cell) {
          formattedValues.push(cell);
        }
        if ((typeof cell === "number" || typeof cell === "string") && typeof relationTo === "string") {
          formattedValues.push({
            relationTo,
            value: cell
          });
        }
      });
      getRelationships(formattedValues);
      setHasRequested(true);
      setValues(formattedValues);
    }
  }, [cellData, relationTo, collections, isAboveViewport, routes.api, hasRequested, getRelationships]);
  useEffect(() => {
    if (hasRequested) {
      setHasRequested(false);
    }
  }, [cellData]);
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    ref: intersectionRef,
    children: [values.map(({
      relationTo,
      value
    }, i) => {
      const document = documents[relationTo][value];
      const relatedCollection = getEntityConfig({
        collectionSlug: relationTo
      });
      const label = formatDocTitle({
        collectionConfig: relatedCollection,
        data: document || null,
        dateFormat: config.admin.dateFormat,
        fallback: `${t("general:untitled")} - ID: ${value}`,
        i18n
      });
      let fileField = null;
      if (field.type === "upload") {
        const fieldPreviewAllowed = "displayPreview" in field ? field.displayPreview : undefined;
        const previewAllowed = fieldPreviewAllowed ?? relatedCollection.upload?.displayPreview ?? true;
        if (previewAllowed && document) {
          fileField = /*#__PURE__*/_jsx(FileCell, {
            cellData: label,
            collectionConfig: relatedCollection,
            collectionSlug: relatedCollection.slug,
            customCellProps: customCellContext,
            field: field,
            rowData: document
          });
        }
      }
      return /*#__PURE__*/_jsxs(React.Fragment, {
        children: [document === false && `${t("general:untitled")} - ID: ${value}`, document === null && `${t("general:loading")}...`, document ? fileField || label : null, values.length > i + 1 && ", "]
      }, i);
    }), Array.isArray(cellData) && cellData.length > totalToShow && t("fields:itemsAndMore", {
      count: cellData.length - totalToShow,
      items: ""
    }), values.length === 0 && t("general:noLabel", {
      label: getTranslation(label || "", i18n)
    })]
  });
};
//# sourceMappingURL=index.js.map