"use node";

// Plugin sinks
import { discordAnnouncementsSink } from "@convex-config/plugins/discord/notificationsSink";

import { registerNotificationSink } from "./registry";
// Core sinks
import { emailSink } from "./sinks/emailSink";

registerNotificationSink(emailSink);
registerNotificationSink(discordAnnouncementsSink);
