import { defineApp } from "convex/server";
import launchthat_core_tenant from "../../../packages/launchthat-plugin-core-tenant/src/convex/component/convex.config";
import launchthat_discord from "../../../packages/launchthat-plugin-discord/src/convex/component/convex.config";
import launchthat_email from "../../../packages/launchthat-plugin-email/src/convex/component/convex.config";
import launchthat_feedback from "../../../packages/launchthat-plugin-feedback/src/convex/component/convex.config";
import launchthat_notifications from "../../../packages/launchthat-plugin-notifications/src/convex/component/convex.config";
import launchthat_onboarding from "../../../packages/launchthat-plugin-onboarding/src/convex/component/convex.config";
import launchthat_pricedata from "../../../packages/launchthat-plugin-pricedata/src/convex/component/convex.config";
import launchthat_push from "../../../packages/launchthat-plugin-push/src/convex/component/convex.config";
import launchthat_traderlaunchpad from "../../../packages/launchthat-plugin-traderlaunchpad/src/convex/component/convex.config";

const app = defineApp();

// Core tenant primitives (users/orgs/memberships) used by notifications and other shared features.
app.use(launchthat_core_tenant);
app.use(launchthat_notifications);
app.use(launchthat_push);
app.use(launchthat_email);
app.use(launchthat_feedback);
app.use(launchthat_traderlaunchpad);
app.use(launchthat_pricedata);
app.use(launchthat_discord);
app.use(launchthat_onboarding);

export default app;
