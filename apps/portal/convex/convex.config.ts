import actionCache from "@convex-dev/action-cache/convex.config";
import agent from "@convex-dev/agent/convex.config";
import { defineApp } from "convex/server";
import launchthat_ecommerce from "launchthat-plugin-commerce/convex/component/convex.config";
import launchthat_support from "launchthat-plugin-support/convex/component/convex.config";
import presence from "@convex-dev/presence/convex.config";
import rag from "@convex-dev/rag/convex.config";
import schema from "./schema";

const app = defineApp({ schema });

app.use(agent);
app.use(presence);
app.use(rag);
app.use(actionCache);
app.use(launchthat_ecommerce);
app.use(launchthat_support);
export default app;
