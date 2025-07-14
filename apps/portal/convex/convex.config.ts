import actionCache from "@convex-dev/action-cache/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(actionCache);

export default app;
