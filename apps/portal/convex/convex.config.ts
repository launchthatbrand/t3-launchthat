import actionCache from "@convex-dev/action-cache/convex.config";
import agent from "@convex-dev/agent/convex.config";
import presence from "@convex-dev/presence/convex.config";
import rag from "@convex-dev/rag/convex.config";
import { defineApp } from "convex/server";
import launchthat_ecommerce from "launchthat-plugin-commerce/convex/component/convex.config";
import launchthat_lms from "launchthat-plugin-lms/convex/component/convex.config";
import launchthat_socialfeed from "launchthat-plugin-socialfeed/convex/component/convex.config";
import launchthat_support from "launchthat-plugin-support/convex/component/convex.config";

import schema from "./schema";

const app = defineApp({ schema });

app.use(agent);
app.use(presence);
app.use(rag);
app.use(actionCache);
app.use(launchthat_ecommerce);
app.use(launchthat_support);
app.use(launchthat_socialfeed);
app.use(launchthat_lms);
export default app;
