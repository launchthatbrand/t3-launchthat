"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { ChevronIcon } from "../../../icons/Chevron/index.js";
import { useConfig } from "../../../providers/Config/index.js";
import { useTranslation } from "../../../providers/Translation/index.js";
import { Button } from "../../Button/index.js";
import { EditManyBulkUploads } from "../EditMany/index.js";
import { useFormsManager } from "../FormsManager/index.js";
const baseClass = "bulk-upload--actions-bar";
export function ActionsBar({
  collectionConfig
}) {
  const {
    activeIndex,
    forms,
    setActiveIndex
  } = useFormsManager();
  const {
    t
  } = useTranslation();
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [/*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__navigation`,
      children: [/*#__PURE__*/_jsxs("p", {
        className: `${baseClass}__locationText`,
        children: [/*#__PURE__*/_jsx("strong", {
          children: activeIndex + 1
        }), " of ", /*#__PURE__*/_jsx("strong", {
          children: forms.length
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__controls`,
        children: [/*#__PURE__*/_jsx(Button, {
          "aria-label": t("general:previous"),
          buttonStyle: "none",
          onClick: () => {
            const nextIndex = activeIndex - 1;
            if (nextIndex < 0) {
              setActiveIndex(forms.length - 1);
            } else {
              setActiveIndex(nextIndex);
            }
          },
          type: "button",
          children: /*#__PURE__*/_jsx(ChevronIcon, {
            direction: "left"
          })
        }), /*#__PURE__*/_jsx(Button, {
          "aria-label": t("general:next"),
          buttonStyle: "none",
          onClick: () => {
            const nextIndex = activeIndex + 1;
            if (nextIndex === forms.length) {
              setActiveIndex(0);
            } else {
              setActiveIndex(nextIndex);
            }
          },
          type: "button",
          children: /*#__PURE__*/_jsx(ChevronIcon, {
            direction: "right"
          })
        })]
      }), /*#__PURE__*/_jsx(EditManyBulkUploads, {
        collection: collectionConfig
      })]
    }), /*#__PURE__*/_jsx(Actions, {
      className: `${baseClass}__saveButtons`
    })]
  });
}
export function Actions({
  className
}) {
  const {
    getEntityConfig
  } = useConfig();
  const {
    t
  } = useTranslation();
  const {
    collectionSlug,
    hasPublishPermission,
    hasSavePermission,
    saveAllDocs
  } = useFormsManager();
  const collectionConfig = getEntityConfig({
    collectionSlug
  });
  return /*#__PURE__*/_jsxs("div", {
    className: [`${baseClass}__buttons`, className].filter(Boolean).join(" "),
    children: [collectionConfig?.versions?.drafts && hasSavePermission ? /*#__PURE__*/_jsx(Button, {
      buttonStyle: "secondary",
      onClick: () => void saveAllDocs({
        overrides: {
          _status: "draft"
        }
      }),
      children: t("version:saveDraft")
    }) : null, collectionConfig?.versions?.drafts && hasPublishPermission ? /*#__PURE__*/_jsx(Button, {
      onClick: () => void saveAllDocs({
        overrides: {
          _status: "published"
        }
      }),
      children: t("version:publish")
    }) : null, !collectionConfig?.versions?.drafts && hasSavePermission ? /*#__PURE__*/_jsx(Button, {
      onClick: () => void saveAllDocs(),
      children: t("general:save")
    }) : null]
  });
}
//# sourceMappingURL=index.js.map