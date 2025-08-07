import { MockStorage } from "convex/testing";

import { api } from "../../../_generated/api";
import { DataModel } from "../../../_generated/dataModel";

const mockDb = new MockStorage<DataModel>({ schemaValidation: true });

const mockCtx = {
  db: mockDb,
  storage: {
    getUrl: async () => null,
  },
  auth: {
    getUserIdentity: async () => null,
  },
  scheduler: {
    runAfter: jest.fn(),
    runAt: jest.fn(),
  },
};

// Reset the database before each test
beforeEach(() => {
  mockDb.clear();
});

describe("Social Feed Mutations", () => {
  let userId: any;
  let feedItemId: any;
  let commentId: any;

  beforeEach(async () => {
    // Add a test user
    userId = await mockDb.insert("users", {
      name: "Test User",
      email: "test@example.com",
    });

    // Add a test feed item
    feedItemId = await mockDb.insert("feedItems", {
      contentType: "post",
      creatorId: userId,
      content: "Test post content",
      visibility: "public",
    });

    // Add a test comment
    commentId = await mockDb.insert("comments", {
      feedItemId,
      userId,
      content: "Test comment",
      updatedAt: Date.now(),
    });
  });

  describe("createPost", () => {
    it("should create a new post", async () => {
      const result = await api.socialfeed.mutations.createPost(mockCtx as any, {
        creatorId: userId,
        content: "New post content",
        visibility: "public",
      });

      // Verify post was created
      const post = await mockDb.get(result);
      expect(post).toBeDefined();
      expect(post?.content).toBe("New post content");
      expect(post?.visibility).toBe("public");
      expect(post?.contentType).toBe("post");
    });

    it("should throw an error for empty content", async () => {
      await expect(
        api.socialfeed.mutations.createPost(mockCtx as any, {
          creatorId: userId,
          content: "   ",
          visibility: "public",
        }),
      ).rejects.toThrow("Content cannot be empty");
    });

    it("should throw an error for invalid user", async () => {
      const invalidUserId = await mockDb.insert("users", {});
      await mockDb.delete(invalidUserId);

      await expect(
        api.socialfeed.mutations.createPost(mockCtx as any, {
          creatorId: invalidUserId,
          content: "Test content",
          visibility: "public",
        }),
      ).rejects.toThrow("User not found");
    });
  });

  describe("updatePost", () => {
    it("should update an existing post", async () => {
      const result = await api.socialfeed.mutations.updatePost(mockCtx as any, {
        postId: feedItemId,
        userId,
        content: "Updated content",
      });

      expect(result).toBe(true);

      // Verify the update
      const updatedPost = await mockDb.get(feedItemId);
      expect(updatedPost?.content).toBe("Updated content");
    });

    it("should throw an error when user doesn't own the post", async () => {
      const otherUserId = await mockDb.insert("users", {
        name: "Other User",
        email: "other@example.com",
      });

      await expect(
        api.socialfeed.mutations.updatePost(mockCtx as any, {
          postId: feedItemId,
          userId: otherUserId,
          content: "I shouldn't be able to update this",
        }),
      ).rejects.toThrow("User does not have permission to update this post");
    });
  });

  describe("deletePost", () => {
    it("should mark a post as deleted", async () => {
      const result = await api.socialfeed.mutations.deletePost(mockCtx as any, {
        postId: feedItemId,
        userId,
      });

      expect(result).toBe(true);

      // Verify the post is marked as deleted
      const deletedPost = await mockDb.get(feedItemId);
      expect(deletedPost?.deleted).toBe(true);
      expect(deletedPost?.deletedAt).toBeDefined();
    });

    it("should throw an error when user doesn't own the post", async () => {
      const otherUserId = await mockDb.insert("users", {
        name: "Other User",
        email: "other@example.com",
      });

      await expect(
        api.socialfeed.mutations.deletePost(mockCtx as any, {
          postId: feedItemId,
          userId: otherUserId,
        }),
      ).rejects.toThrow("User does not have permission to delete this post");
    });
  });

  describe("shareContent", () => {
    it("should create a share post", async () => {
      const result = await api.socialfeed.mutations.shareContent(
        mockCtx as any,
        {
          creatorId: userId,
          originalContentId: feedItemId,
          content: "Sharing this post",
          visibility: "public",
        },
      );

      // Verify share was created
      const share = await mockDb.get(result);
      expect(share).toBeDefined();
      expect(share?.contentType).toBe("share");
      expect(share?.originalContentId).toEqual(feedItemId);
      expect(share?.content).toBe("Sharing this post");
    });

    it("should throw an error when sharing deleted content", async () => {
      // Mark the original post as deleted
      await mockDb.patch(feedItemId, {
        deleted: true,
        deletedAt: Date.now(),
      });

      await expect(
        api.socialfeed.mutations.shareContent(mockCtx as any, {
          creatorId: userId,
          originalContentId: feedItemId,
          visibility: "public",
        }),
      ).rejects.toThrow("Cannot share deleted content");
    });
  });

  describe("addReaction", () => {
    it("should add a reaction to a post", async () => {
      const result = await api.socialfeed.mutations.addReaction(
        mockCtx as any,
        {
          userId,
          feedItemId,
          reactionType: "like",
        },
      );

      // Verify reaction was created
      const reaction = await mockDb.get(result);
      expect(reaction).toBeDefined();
      expect(reaction?.reactionType).toBe("like");
      expect(reaction?.feedItemId).toEqual(feedItemId);
    });

    it("should update an existing reaction", async () => {
      // Add an initial reaction
      const initialReactionId = await api.socialfeed.mutations.addReaction(
        mockCtx as any,
        {
          userId,
          feedItemId,
          reactionType: "like",
        },
      );

      // Update to a different reaction type
      const updatedReactionId = await api.socialfeed.mutations.addReaction(
        mockCtx as any,
        {
          userId,
          feedItemId,
          reactionType: "love",
        },
      );

      // Verify IDs are the same (reaction was updated, not newly created)
      expect(updatedReactionId).toEqual(initialReactionId);

      // Verify reaction type was updated
      const reaction = await mockDb.get(updatedReactionId);
      expect(reaction?.reactionType).toBe("love");
    });
  });

  describe("removeReaction", () => {
    it("should remove a reaction", async () => {
      // First add a reaction
      const reactionId = await api.socialfeed.mutations.addReaction(
        mockCtx as any,
        {
          userId,
          feedItemId,
          reactionType: "like",
        },
      );

      // Then remove it
      const result = await api.socialfeed.mutations.removeReaction(
        mockCtx as any,
        {
          userId,
          feedItemId,
        },
      );

      expect(result).toBe(true);

      // Verify reaction is gone
      const reaction = await mockDb.get(reactionId);
      expect(reaction).toBeNull();
    });

    it("should return false when no reaction exists", async () => {
      const result = await api.socialfeed.mutations.removeReaction(
        mockCtx as any,
        {
          userId,
          feedItemId: await mockDb.insert("feedItems", {
            contentType: "post",
            creatorId: userId,
            content: "Another post",
            visibility: "public",
          }),
        },
      );

      expect(result).toBe(false);
    });
  });

  describe("addComment", () => {
    it("should add a comment to a post", async () => {
      const result = await api.socialfeed.mutations.addComment(mockCtx as any, {
        userId,
        feedItemId,
        content: "New comment",
      });

      // Verify comment was created
      const comment = await mockDb.get(result);
      expect(comment).toBeDefined();
      expect(comment?.content).toBe("New comment");
      expect(comment?.feedItemId).toEqual(feedItemId);
    });

    it("should support nested comments", async () => {
      const result = await api.socialfeed.mutations.addComment(mockCtx as any, {
        userId,
        feedItemId,
        content: "Reply to comment",
        parentCommentId: commentId,
      });

      // Verify nested comment was created
      const reply = await mockDb.get(result);
      expect(reply).toBeDefined();
      expect(reply?.parentCommentId).toEqual(commentId);
    });
  });

  describe("updateComment", () => {
    it("should update a comment", async () => {
      const result = await api.socialfeed.mutations.updateComment(
        mockCtx as any,
        {
          commentId,
          userId,
          content: "Updated comment",
        },
      );

      expect(result).toBe(true);

      // Verify the update
      const updatedComment = await mockDb.get(commentId);
      expect(updatedComment?.content).toBe("Updated comment");
      expect(updatedComment?.updatedAt).toBeDefined();
    });

    it("should throw an error when user doesn't own the comment", async () => {
      const otherUserId = await mockDb.insert("users", {
        name: "Other User",
        email: "other@example.com",
      });

      await expect(
        api.socialfeed.mutations.updateComment(mockCtx as any, {
          commentId,
          userId: otherUserId,
          content: "I shouldn't be able to update this",
        }),
      ).rejects.toThrow("User does not have permission to update this comment");
    });
  });

  describe("deleteComment", () => {
    it("should mark a comment as deleted", async () => {
      const result = await api.socialfeed.mutations.deleteComment(
        mockCtx as any,
        {
          commentId,
          userId,
        },
      );

      expect(result).toBe(true);

      // Verify the comment is marked as deleted
      const deletedComment = await mockDb.get(commentId);
      expect(deletedComment?.deleted).toBe(true);
      expect(deletedComment?.deletedAt).toBeDefined();
    });

    it("should throw an error when user doesn't own the comment", async () => {
      const otherUserId = await mockDb.insert("users", {
        name: "Other User",
        email: "other@example.com",
      });

      await expect(
        api.socialfeed.mutations.deleteComment(mockCtx as any, {
          commentId,
          userId: otherUserId,
        }),
      ).rejects.toThrow("User does not have permission to delete this comment");
    });
  });
});
