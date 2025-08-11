import { defineSchema } from "convex/server";
import commentsSchema from "./commentsSchema";
import contentRecommendationsSchema from "./contentRecommendationsSchema";
import feedItemsSchema from "./feedItemsSchema";
import hashtagsSchema from "./hashtagsSchema";
import reactionsSchema from "./reactionsSchema";
import savedItemsSchema from "./savedItemsSchema";
import subscriptionsSchema from "./subscriptionsSchema";
import topicFollowsSchema from "./topicFollowsSchema";
import trendingContentSchema from "./trendingContentSchema";
export const socialFeedSchema = defineSchema({
    ...feedItemsSchema.tables,
    ...reactionsSchema.tables,
    ...commentsSchema.tables,
    ...subscriptionsSchema.tables,
    ...savedItemsSchema.tables,
    ...hashtagsSchema.tables,
    ...topicFollowsSchema.tables,
    ...contentRecommendationsSchema.tables,
    ...trendingContentSchema.tables,
});
export default socialFeedSchema;
