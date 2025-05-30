"use client";

import "./index.scss";

import type { GenericDescriptionProps } from "@convexcms/core";
import React from "react";
import { getTranslation } from "@convexcms/translations";

import { useTranslation } from "../../providers/Translation/index.js";

const baseClass = "field-description";

export const FieldDescription: React.FC<GenericDescriptionProps> = (props) => {
  const { className, description, marginPlacement, path } = props;

  const { i18n } = useTranslation();

  if (description) {
    return (
      <div
        className={[
          baseClass,
          className,
          `field-description-${path?.replace(/\./g, "__")}`,
          marginPlacement && `${baseClass}--margin-${marginPlacement}`,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {getTranslation(description, i18n)}
      </div>
    );
  }

  return null;
};
