import { CollapsibleObjectField } from "../utils/CollapsibleObjectField";

/**
 * Object Accordion Plugin
 * Puck plugin that provides collapsible accordion UI for all object field types
 */
export const objectAccordionPlugin = {
  overrides: {
    fieldTypes: {
      object: CollapsibleObjectField,
    },
  },
};
