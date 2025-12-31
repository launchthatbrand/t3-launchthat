"use client";

import type { AdminSinglePostViewProps } from "./AdminSinglePostView";
import { AdminSinglePostView } from "./AdminSinglePostView";
import { registerCoreMetaBoxes } from "./metaBoxes/registry";

registerCoreMetaBoxes();

export const AdminSinglePostContainer = (props: AdminSinglePostViewProps) => {
  return <AdminSinglePostView {...props} />;
};


