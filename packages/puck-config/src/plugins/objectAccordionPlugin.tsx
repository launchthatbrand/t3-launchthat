import { CollapsibleObjectField } from "../utils/CollapsibleObjectField";
import React from "react";

/**
 * Object Accordion Plugin
 * Puck plugin that provides collapsible accordion UI for all object field types
 */
export const objectAccordionPlugin = {
  overrides: {
    fieldTypes: {
      object: (/** @type {any} */ props) => {
        if (props && props.field && typeof props.field.render === "function") {
          return props.field.render(props);
        }
        return <CollapsibleObjectField {...props} />;
      },
    },
  },
};
