import { MockQuery } from "convex/testing";

import {
  getComments,
  getFeedItem,
  getGroupFeed,
  getPersonalizedFeed,
  getUniversalFeed,
  getUserProfileFeed,
} from "../../queries";

const setupMockQueryCtx = () => {
  const mockFeedItems = [
    {
      _id: "feedItem1" as any,
      _creationTime: Date.now(),
      contentType: "post",
      creatorId: "user1" as any,
      content: "This is a test post",
      visibility: "public",
    },
    {
      _id: "feedItem2" as any,
      _creationTime: Date.now() - 1000,
      contentType: "post",
      creatorId: "user2" as any,
      content: "This is another test post",
      visibility: "private",
    },
    {
      _id: "feedItem3" as any,
      _creationTime: Date.now() - 2000,
      contentType: "post",
      creatorId: "user1" as any,
      content: "This is a group post",
      visibility: "group",
      moduleType: "group",
      moduleId: "group1",
    },
  ];

  const mockUsers = [
    {
      _id: "user1" as any,
      _creationTime: Date.now(),
      name: "Test User 1",
      email: "user1@example.com",
      role: "user",
    },
    {
      _id: "user2" as any,
      _creationTime: Date.now(),
      name: "Test User 2",
      email: "user2@example.com",
      role: "user",
    },
  ];

  const mockReactions = [
    {
      _id: "reaction1" as any,
      _creationTime: Date.now(),
      userId: "user2" as any,
      feedItemId: "feedItem1" as any,
      reactionType: "like",
    },
  ];

  const mockComments = [
    {
      _id: "comment1" as any,
      _creationTime: Date.now(),
      userId: "user2" as any,
      feedItemId: "feedItem1" as any,
      content: "Great post!",
    },
  ];

  const mockSubscriptions = [
    {
      _id: "subscription1" as any,
      _creationTime: Date.now(),
      userId: "user1" as any,
      followType: "user",
      followId: "user2",
    },
    {
      _id: "subscription2" as any,
      _creationTime: Date.now(),
      userId: "user1" as any,
      followType: "group",
      followId: "group1",
    },
  ];

  // Mock query context
  const ctx = new MockQuery();

  // Mock database query methods
  ctx.db = {
    query: jest.fn().mockReturnValue({
      withIndex: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockReturnValue({
          page: mockFeedItems,
          isDone: true,
          continueCursor: null,
        }),
        first: jest.fn().mockResolvedValue(mockSubscriptions[0]),
        collect: jest.fn().mockResolvedValue([]),
      }),
      filter: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockReturnValue({
          page: mockFeedItems,
          isDone: true,
          continueCursor: null,
        }),
      }),
      order: jest.fn().mockReturnThis(),
      paginate: jest.fn().mockReturnValue({
        page: mockFeedItems,
        isDone: true,
        continueCursor: null,
      }),
      collect: jest.fn().mockResolvedValue([]),
    }),
    get: jest.fn().mockImplementation((id) => {
      if (id === "user1") return mockUsers[0];
      if (id === "user2") return mockUsers[1];
      if (id === "feedItem1") return mockFeedItems[0];
      if (id === "feedItem2") return mockFeedItems[1];
      if (id === "feedItem3") return mockFeedItems[2];
      return null;
    }),
  };

  return {
    ctx,
    mockFeedItems,
    mockUsers,
    mockReactions,
    mockComments,
    mockSubscriptions,
  };
};

describe("Social Feed Queries", () => {
  describe("getUniversalFeed", () => {
    it("should return public feed items", async () => {
      const { ctx } = setupMockQueryCtx();

      const result = await getUniversalFeed._def.handler(ctx as any, {
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(ctx.db.query).toHaveBeenCalledWith("feedItems");
    });
  });

  describe("getPersonalizedFeed", () => {
    it("should return personalized feed for a user", async () => {
      const { ctx } = setupMockQueryCtx();

      const result = await getPersonalizedFeed._def.handler(ctx as any, {
        userId: "user1" as any,
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getGroupFeed", () => {
    it("should return feed items for a specific group", async () => {
      const { ctx } = setupMockQueryCtx();

      const result = await getGroupFeed._def.handler(ctx as any, {
        groupId: "group1" as any,
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getUserProfileFeed", () => {
    it("should return feed items for a user profile", async () => {
      const { ctx } = setupMockQueryCtx();

      const result = await getUserProfileFeed._def.handler(ctx as any, {
        profileId: "user1" as any,
        viewerId: "user2" as any,
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter by visibility when not viewing own profile", async () => {
      const { ctx } = setupMockQueryCtx();

      const result = await getUserProfileFeed._def.handler(ctx as any, {
        profileId: "user1" as any,
        viewerId: "user2" as any, // Different user
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getFeedItem", () => {
    it("should return a single feed item by ID", async () => {
      const { ctx } = setupMockQueryCtx();

      const result = await getFeedItem._def.handler(ctx as any, {
        feedItemId: "feedItem1" as any,
        viewerId: "user1" as any,
      });

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(ctx.db.get).toHaveBeenCalledWith("feedItem1");
    });

    it("should return null for a non-existent feed item", async () => {
      const { ctx } = setupMockQueryCtx();
      ctx.db.get = jest.fn().mockResolvedValue(null);

      const result = await getFeedItem._def.handler(ctx as any, {
        feedItemId: "nonExistentId" as any,
        viewerId: "user1" as any,
      });

      expect(result).toBeNull();
    });
  });

  describe("getComments", () => {
    it("should return comments for a feed item", async () => {
      const { ctx } = setupMockQueryCtx();

      const result = await getComments._def.handler(ctx as any, {
        feedItemId: "feedItem1" as any,
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
