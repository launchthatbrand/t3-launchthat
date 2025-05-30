"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { useAuth } from "../../../providers/Auth/index.js";
import { EditDepthProvider } from "../../../providers/EditDepth/index.js";
import { useTranslation } from "../../../providers/Translation/index.js";
import { Drawer, DrawerToggler } from "../../Drawer/index.js";
import { useFormsManager } from "../FormsManager/index.js";
import { EditManyBulkUploadsDrawerContent } from "./DrawerContent.js";
export const baseClass = "edit-many-bulk-uploads";
export const EditManyBulkUploads = props => {
  const {
    collection: {
      slug
    } = {},
    collection
  } = props;
  const {
    permissions
  } = useAuth();
  const {
    t
  } = useTranslation();
  const {
    forms
  } = useFormsManager(); // Access forms managed in bulk uploads
  const collectionPermissions = permissions?.collections?.[slug];
  const hasUpdatePermission = collectionPermissions?.update;
  const drawerSlug = `edit-${slug}-bulk-uploads`;
  if (!hasUpdatePermission) {
    return null;
  }
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [/*#__PURE__*/_jsx(DrawerToggler, {
      "aria-label": t("general:editAll"),
      className: `${baseClass}__toggle`,
      slug: drawerSlug,
      children: t("general:editAll")
    }), /*#__PURE__*/_jsx(EditDepthProvider, {
      children: /*#__PURE__*/_jsx(Drawer, {
        Header: null,
        slug: drawerSlug,
        children: /*#__PURE__*/_jsx(EditManyBulkUploadsDrawerContent, {
          collection: collection,
          drawerSlug: drawerSlug,
          forms: forms
        })
      })
    })]
  });
};
//# sourceMappingURL=index.js.map