"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { Fragment } from "react";
import { SelectAllStatus, useSelection } from "../../providers/Selection/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { DeleteMany } from "../DeleteMany/index.js";
import { EditMany } from "../EditMany/index.js";
import { PublishMany } from "../PublishMany/index.js";
import { UnpublishMany } from "../UnpublishMany/index.js";
const baseClass = "list-selection";
export const ListSelection = ({
  collectionConfig,
  disableBulkDelete,
  disableBulkEdit,
  label
}) => {
  const {
    count,
    selectAll,
    toggleAll,
    totalDocs
  } = useSelection();
  const {
    t
  } = useTranslation();
  if (count === 0) {
    return null;
  }
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [/*#__PURE__*/_jsx("span", {
      children: t("general:selectedCount", {
        count,
        label: ""
      })
    }), selectAll !== SelectAllStatus.AllAvailable && count < totalDocs && /*#__PURE__*/_jsx("button", {
      "aria-label": t("general:selectAll", {
        count,
        label
      }),
      className: `${baseClass}__button`,
      id: "select-all-across-pages",
      onClick: () => toggleAll(true),
      type: "button",
      children: t("general:selectAll", {
        count: totalDocs,
        label: ""
      })
    }), !disableBulkEdit && !disableBulkDelete && /*#__PURE__*/_jsx("span", {
      children: "—"
    }), !disableBulkEdit && /*#__PURE__*/_jsxs(Fragment, {
      children: [/*#__PURE__*/_jsx(EditMany, {
        collection: collectionConfig
      }), /*#__PURE__*/_jsx(PublishMany, {
        collection: collectionConfig
      }), /*#__PURE__*/_jsx(UnpublishMany, {
        collection: collectionConfig
      })]
    }), !disableBulkDelete && /*#__PURE__*/_jsx(DeleteMany, {
      collection: collectionConfig
    })]
  });
};
//# sourceMappingURL=index.js.map