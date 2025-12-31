import { registerPageTemplate } from "./registry";
import { getEcommercePageTemplates } from "launchthat-plugin-ecommerce";

let registered = false;

export const registerPluginPageTemplates = () => {
  if (registered) return;

  // Ecommerce
  for (const template of getEcommercePageTemplates()) {
    registerPageTemplate(template as any, null);
  }

  registered = true;
};


