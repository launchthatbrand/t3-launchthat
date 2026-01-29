// When composing components (component.use), Convex expects imported child component
// configs to include a `componentDefinitionPath` so it can locate the component’s
// source directory during analysis/bundling.
//
// Keep this file free of Node built-ins (esbuild bundling environment).
export default {
  // Must be a plain string in Convex analysis environment.
  componentDefinitionPath: "launchthat-plugin-ecommerce-stripe/convex.config.js",
  defaultName: "launchthat_ecommerce_stripe",
};

