import { v } from "convex/values";

import { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";

// Standard mock user data
export const MOCK_USER_DATA = {
  email: "mockuser@launchthat.app",
  name: "MOCK USER",
  firstName: "MOCK",
  lastName: "USER",
  phone: "+1-555-MOCK",
};

// Standard mock address
export const MOCK_ADDRESS = {
  fullName: "MOCK USER",
  addressLine1: "123 Mock Street",
  addressLine2: "Suite 100",
  city: "Mock City",
  stateOrProvince: "CA",
  postalCode: "12345",
  country: "US",
  phoneNumber: "+1-555-MOCK",
};

/**
 * Create or retrieve a mock user for testing purposes
 * This function is designed to be called by other mock data functions
 */
export const createMockUser = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    userId: v.optional(v.id("users")),
  }),
  handler: async (ctx) => {
    try {
      // Check if mock user already exists
      let mockUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", MOCK_USER_DATA.email))
        .first();

      if (!mockUser) {
        // Create mock user
        const mockUserId = await ctx.db.insert("users", {
          email: MOCK_USER_DATA.email,
          name: MOCK_USER_DATA.name,
          role: "customer", // Default role for mock user
          addresses: [MOCK_ADDRESS],
        });
        mockUser = await ctx.db.get(mockUserId);
      }

      if (!mockUser) {
        throw new Error("Failed to create or retrieve mock user");
      }

      return {
        success: true,
        userId: mockUser._id as Id<"users">,
      };
    } catch (error) {
      console.error("Error creating mock user:", error);
      return {
        success: false,
        userId: undefined,
      };
    }
  },
});

/**
 * Get the mock user if it exists
 * This returns just the user ID for other functions to use
 */
export const getMockUser = mutation({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      email: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const mockUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", MOCK_USER_DATA.email))
      .first();

    if (!mockUser) {
      return null;
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      _id: mockUser._id as Id<"users">,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      email: mockUser.email,
    };
  },
});

/**
 * Delete the mock user and clean up related data
 * Useful for cleaning up test data
 */
export const deleteMockUser = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    try {
      const mockUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", MOCK_USER_DATA.email))
        .first();

      if (!mockUser) {
        return {
          success: true,
          message: "Mock user does not exist",
        };
      }

      // Delete the mock user
      await ctx.db.delete(mockUser._id);

      return {
        success: true,
        message: "Mock user deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting mock user:", error);
      return {
        success: false,
        message: "Failed to delete mock user",
      };
    }
  },
});
