import { defineApp } from "convex/server";

import launchthat_discord from "../../../packages/launchthat-plugin-discord/src/convex/component/convex.config";
import launchthat_traderlaunchpad from "../../../packages/launchthat-plugin-traderlaunchpad/src/convex/component/convex.config";

const app = defineApp();

app.use(launchthat_traderlaunchpad);
app.use(launchthat_discord);

export default app;
