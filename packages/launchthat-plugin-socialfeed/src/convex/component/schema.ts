import { defineSchema } from "convex/server";

import { commentsSchema } from "./comments/schema";
import { contentRecommendationsSchema } from "./contentRecommendations/schema";
import { feedItemsSchema } from "./feedItems/schema";
import { hashtagsSchema } from "./hashtags/schema";
import { reactionsSchema } from "./reactions/schema";
import { savedItemsSchema } from "./savedItems/schema";
import { subscriptionsSchema } from "./subscriptions/schema";
import { topicFollowsSchema } from "./topicFollows/schema";
import { trendingContentSchema } from "./trendingContent/schema";

export default defineSchema({
  ...feedItemsSchema,
  ...reactionsSchema,
  ...commentsSchema,
  ...subscriptionsSchema,
  ...savedItemsSchema,
  ...hashtagsSchema,
  ...topicFollowsSchema,
  ...contentRecommendationsSchema,
  ...trendingContentSchema,
});
