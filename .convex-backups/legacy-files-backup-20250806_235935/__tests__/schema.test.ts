import socialFeedSchema from "..";
import { commentsSchema } from "../commentsSchema";
import { feedItemsSchema } from "../feedItemsSchema";
import { reactionsSchema } from "../reactionsSchema";
import { savedItemsSchema } from "../savedItemsSchema";
import { subscriptionsSchema } from "../subscriptionsSchema";

describe("Social Feed Schema", () => {
  // Test feed items schema
  describe("Feed Items Schema", () => {
    it("should define a feedItems table", () => {
      expect(feedItemsSchema.feedItems).toBeDefined();
    });

    it("should require contentType, creatorId, content, and visibility fields", () => {
      const validator = feedItemsSchema.feedItems._def;
      expect(validator.contentType).toBeDefined();
      expect(validator.creatorId).toBeDefined();
      expect(validator.content).toBeDefined();
      expect(validator.visibility).toBeDefined();
    });

    it("should have appropriate indexes", () => {
      const indexes = feedItemsSchema.feedItems._indexes;
      expect(indexes.some((idx) => idx.name === "by_creator")).toBe(true);
      expect(indexes.some((idx) => idx.name === "by_visibility")).toBe(true);
      expect(indexes.some((idx) => idx.name === "by_module")).toBe(true);
      expect(indexes.some((idx) => idx.name === "by_original_content")).toBe(
        true,
      );
    });
  });

  // Test reactions schema
  describe("Reactions Schema", () => {
    it("should define a reactions table", () => {
      expect(reactionsSchema.reactions).toBeDefined();
    });

    it("should require userId, feedItemId, and reactionType fields", () => {
      const validator = reactionsSchema.reactions._def;
      expect(validator.userId).toBeDefined();
      expect(validator.feedItemId).toBeDefined();
      expect(validator.reactionType).toBeDefined();
    });

    it("should have appropriate indexes", () => {
      const indexes = reactionsSchema.reactions._indexes;
      expect(indexes.some((idx) => idx.name === "by_user")).toBe(true);
      expect(indexes.some((idx) => idx.name === "by_feed_item")).toBe(true);
      expect(indexes.some((idx) => idx.name === "by_user_and_item")).toBe(true);
    });
  });

  // Test comments schema
  describe("Comments Schema", () => {
    it("should define a comments table", () => {
      expect(commentsSchema.comments).toBeDefined();
    });

    it("should require feedItemId, userId, and content fields", () => {
      const validator = commentsSchema.comments._def;
      expect(validator.feedItemId).toBeDefined();
      expect(validator.userId).toBeDefined();
      expect(validator.content).toBeDefined();
    });

    it("should have appropriate indexes", () => {
      const indexes = commentsSchema.comments._indexes;
      expect(indexes.some((idx) => idx.name === "by_feed_item")).toBe(true);
      expect(indexes.some((idx) => idx.name === "by_user")).toBe(true);
      expect(indexes.some((idx) => idx.name === "by_parent")).toBe(true);
    });
  });

  // Test subscriptions schema
  describe("Subscriptions Schema", () => {
    it("should define a subscriptions table", () => {
      expect(subscriptionsSchema.subscriptions).toBeDefined();
    });

    it("should require userId, followType, and followId fields", () => {
      const validator = subscriptionsSchema.subscriptions._def;
      expect(validator.userId).toBeDefined();
      expect(validator.followType).toBeDefined();
      expect(validator.followId).toBeDefined();
    });

    it("should have appropriate indexes", () => {
      const indexes = subscriptionsSchema.subscriptions._indexes;
      expect(indexes.some((idx) => idx.name === "by_user")).toBe(true);
      expect(indexes.some((idx) => idx.name === "by_follow_type_and_id")).toBe(
        true,
      );
      expect(indexes.some((idx) => idx.name === "by_user_and_type")).toBe(true);
      expect(indexes.some((idx) => idx.name === "by_user_follow")).toBe(true);
    });
  });

  // Test saved items schema
  describe("Saved Items Schema", () => {
    it("should define a savedItems table", () => {
      expect(savedItemsSchema.savedItems).toBeDefined();
    });

    it("should require userId and feedItemId fields", () => {
      const validator = savedItemsSchema.savedItems._def;
      expect(validator.userId).toBeDefined();
      expect(validator.feedItemId).toBeDefined();
    });

    it("should have appropriate indexes", () => {
      const indexes = savedItemsSchema.savedItems._indexes;
      expect(indexes.some((idx) => idx.name === "by_user")).toBe(true);
      expect(indexes.some((idx) => idx.name === "by_feed_item")).toBe(true);
      expect(indexes.some((idx) => idx.name === "by_user_and_collection")).toBe(
        true,
      );
    });
  });

  // Test the combined schema
  describe("Combined Social Feed Schema", () => {
    it("should include all tables from individual schemas", () => {
      expect(socialFeedSchema.tables.feedItems).toBeDefined();
      expect(socialFeedSchema.tables.reactions).toBeDefined();
      expect(socialFeedSchema.tables.comments).toBeDefined();
      expect(socialFeedSchema.tables.subscriptions).toBeDefined();
      expect(socialFeedSchema.tables.savedItems).toBeDefined();
    });
  });
});
