"use client";

import type { DocumentViewClientProps } from "@convexcms/core";
import React from "react";
import { DefaultEditView } from "@convexcms/ui";

export const EditView: React.FC<DocumentViewClientProps> = (props) => {
  return <DefaultEditView {...props} />;
};
