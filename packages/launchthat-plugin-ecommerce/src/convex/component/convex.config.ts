import { defineComponent } from "convex/server";
import launchthat_ecommerce_stripe from "launchthat-plugin-ecommerce-stripe/convex.config.js";

const component = defineComponent("launchthat_ecommerce");

// Install Stripe as a child component.
// Data flow: app -> launchthat_ecommerce -> stripe
component.use(launchthat_ecommerce_stripe, { name: "stripe" });

export default component;


