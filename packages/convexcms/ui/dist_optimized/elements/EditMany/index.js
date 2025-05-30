"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { useState } from "react";
import { useModal } from "@faceless-ui/modal";
import { useAuth } from "../../providers/Auth/index.js";
import { EditDepthProvider } from "../../providers/EditDepth/index.js";
import { SelectAllStatus, useSelection } from "../../providers/Selection/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { Drawer } from "../Drawer/index.js";
import { EditManyDrawerContent } from "./DrawerContent.js";
export const baseClass = "edit-many";
export const EditMany = props => {
  const {
    collection: {
      slug
    }
  } = props;
  const {
    permissions
  } = useAuth();
  const {
    openModal
  } = useModal();
  const {
    selectAll
  } = useSelection();
  const {
    t
  } = useTranslation();
  const [selectedFields, setSelectedFields] = useState([]);
  const collectionPermissions = permissions?.collections?.[slug];
  const drawerSlug = `edit-${slug}`;
  if (selectAll === SelectAllStatus.None || !collectionPermissions?.update) {
    return null;
  }
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [/*#__PURE__*/_jsx("button", {
      "aria-label": t("general:edit"),
      className: `${baseClass}__toggle`,
      onClick: () => {
        openModal(drawerSlug);
        setSelectedFields([]);
      },
      type: "button",
      children: t("general:edit")
    }), /*#__PURE__*/_jsx(EditDepthProvider, {
      children: /*#__PURE__*/_jsx(Drawer, {
        Header: null,
        slug: drawerSlug,
        children: /*#__PURE__*/_jsx(EditManyDrawerContent, {
          collection: props.collection,
          drawerSlug: drawerSlug,
          selectedFields: selectedFields,
          setSelectedFields: setSelectedFields
        })
      })
    })]
  });
};
//# sourceMappingURL=index.js.map