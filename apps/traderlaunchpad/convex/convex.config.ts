import { defineApp } from "convex/server";

import launchthat_traderlaunchpad from "../../../packages/launchthat-plugin-traderlaunchpad/src/convex/component/convex.config";

const app = defineApp();

app.use(launchthat_traderlaunchpad);

export default app;
