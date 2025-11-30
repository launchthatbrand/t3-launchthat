import agent from "@convex-dev/agent/convex.config";
import presence from "@convex-dev/presence/convex.config";
import { defineApp } from "convex/server";

import schema from "./schema";

const app = defineApp({ schema });

app.use(agent);
app.use(presence);

export default app;
