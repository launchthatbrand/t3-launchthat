import { socialFeedPlugin } from "./plugin";

export {
  PLUGIN_ID,
  SOCIAL_FEED_FRONTEND_PROVIDER_ID,
  createSocialFeedPluginDefinition,
  configureSocialFeedPlugin,
  socialFeedPlugin,
} from "./plugin";

export * from "./components";
export * from "./context/SocialFeedClientProvider";
export * from "./frontend/SocialFeedGroupSingle";
export * from "./hooks/useContentSharing";
export * from "./hooks/useConvexUser";

export default socialFeedPlugin;


