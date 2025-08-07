import { v } from "convex/values";

import { mutation, query } from "../../_generated/server";

// Simple migration function to create junction table entries from transfer notes
export const createJunctionTableEntries = mutation({
  args: {
    transferId: v.id("transfers"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    orderLinks: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the transfer
      const transfer = await ctx.db.get(args.transferId);
      if (!transfer) {
        return {
          success: false,
          message: "Transfer not found",
          orderLinks: [],
        };
      }

      // Extract order IDs from notes
      if (!transfer.notes || !transfer.notes.includes("associated orders:")) {
        return {
          success: false,
          message: "No order IDs found in transfer notes",
          orderLinks: [],
        };
      }

      const orderIdMatches = transfer.notes.match(/orders:\s*([^.]+)/);
      if (!orderIdMatches) {
        return {
          success: false,
          message: "Could not parse order IDs from notes",
          orderLinks: [],
        };
      }

      const orderIds = orderIdMatches[1].split(",").map((id) => id.trim());
      const orderLinks: string[] = [];

      for (const orderId of orderIds) {
        // Find the order by orderId
        const order = await ctx.db
          .query("orders")
          .filter((q) => q.eq(q.field("orderId"), orderId))
          .first();

        if (order) {
          // Check if junction table entry already exists
          const existingLink = await ctx.db
            .query("transferOrders")
            .withIndex("by_transfer_and_order", (q) =>
              q.eq("transferId", args.transferId).eq("orderId", order._id),
            )
            .first();

          if (!existingLink) {
            // Create junction table entry
            await ctx.db.insert("transferOrders", {
              transferId: args.transferId,
              orderId: order._id,
              orderAmount: order.total,
              processedAt: transfer.initiatedAt,
              notes: `Order ${order.orderId} linked to transfer`,
            });
            orderLinks.push(`${order.orderId} -> linked`);
          } else {
            orderLinks.push(`${order.orderId} -> already linked`);
          }
        } else {
          orderLinks.push(`${orderId} -> order not found`);
        }
      }

      return {
        success: true,
        message: `Processed ${orderIds.length} orders`,
        orderLinks,
      };
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        orderLinks: [],
      };
    }
  },
});

// Query to get transfer details with related orders (properly typed)
export const getTransferWithOrders = query({
  args: {
    transferId: v.id("transfers"),
  },
  returns: v.union(
    v.null(),
    v.object({
      transfer: v.object({
        _id: v.id("transfers"),
        _creationTime: v.number(),
        transferId: v.string(),
        amount: v.number(),
        currency: v.string(),
        bankAccountId: v.id("bankAccounts"),
        paymentProcessor: v.string(),
        status: v.union(
          v.literal("pending"),
          v.literal("in_transit"),
          v.literal("completed"),
          v.literal("failed"),
          v.literal("cancelled"),
          v.literal("reversed"),
        ),
        initiatedAt: v.number(),
        initiatedBy: v.id("users"),
        completedAt: v.optional(v.number()),
        expectedArrival: v.optional(v.number()),
        fees: v.optional(v.number()),
        failureReason: v.optional(v.string()),
        processorTransferId: v.optional(v.string()),
        description: v.optional(v.string()),
        notes: v.optional(v.string()),
      }),
      bankAccount: v.object({
        _id: v.id("bankAccounts"),
        accountName: v.string(),
        bankName: v.string(),
        accountNumber: v.string(),
        accountType: v.union(v.literal("checking"), v.literal("savings")),
      }),
      orders: v.array(
        v.object({
          _id: v.id("orders"),
          _creationTime: v.number(),
          orderId: v.string(),
          customerInfo: v.object({
            firstName: v.string(),
            lastName: v.string(),
            // email is NOT in customerInfo according to orders schema
          }),
          email: v.string(), // Email is a separate field
          shipping: v.number(),
          discount: v.number(),
          subtotal: v.number(),
          total: v.number(),
          status: v.string(),
          paymentStatus: v.string(),
          items: v.array(
            v.object({
              productId: v.string(),
              productSnapshot: v.object({
                name: v.string(),
                price: v.number(),
                imageUrl: v.optional(v.string()),
              }),
              quantity: v.number(),
              lineTotal: v.number(),
            }),
          ),
          // Additional fields from the junction table
          orderAmount: v.number(), // Amount contributed by this order to the transfer
          processedAt: v.number(), // When this order was included in the transfer
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const transfer = await ctx.db.get(args.transferId);
    if (!transfer) return null;

    const bankAccount = await ctx.db.get(transfer.bankAccountId);
    if (!bankAccount) return null;

    // Get related orders through the junction table
    const transferOrderLinks = await ctx.db
      .query("transferOrders")
      .withIndex("by_transfer", (q) => q.eq("transferId", args.transferId))
      .collect();

    const orders = [];
    for (const link of transferOrderLinks) {
      const order = await ctx.db.get(link.orderId);
      if (order) {
        orders.push({
          _id: order._id,
          _creationTime: order._creationTime,
          orderId: order.orderId,
          customerInfo: {
            firstName: order.customerInfo.firstName,
            lastName: order.customerInfo.lastName,
            // email moved to separate field
          },
          email: order.email, // Email is now a separate field
          shipping: order.shipping ?? 0, // Include shipping, default to 0 if not set
          discount: order.discount ?? 0, // Include discount, default to 0 if not set
          subtotal: order.subtotal ?? order.total, // Include subtotal, fallback to total if not set
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          items: order.items.map((item) => ({
            productId: item.productId,
            productSnapshot: {
              name: item.productSnapshot.name,
              price: item.productSnapshot.price,
              imageUrl: item.productSnapshot.imageUrl,
            },
            quantity: item.quantity,
            lineTotal: item.lineTotal,
          })),
          // Include junction table metadata
          orderAmount: link.orderAmount,
          processedAt: link.processedAt,
        });
      }
    }

    return {
      transfer,
      bankAccount: {
        _id: bankAccount._id,
        accountName: bankAccount.accountName,
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        accountType: bankAccount.accountType,
      },
      orders,
    };
  },
});

// Get current store balance
export const getStoreBalance = query({
  args: {
    storeId: v.optional(v.string()),
    paymentProcessor: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("storeBalances"),
      _creationTime: v.number(),
      availableBalance: v.number(),
      pendingBalance: v.number(),
      totalBalance: v.number(),
      currency: v.string(),
      storeId: v.optional(v.string()),
      storeName: v.optional(v.string()),
      lastUpdated: v.number(),
      updatedBy: v.optional(v.id("users")),
      paymentProcessor: v.string(),
      processorAccountId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    let balanceQuery = ctx.db.query("storeBalances");

    if (args.storeId) {
      balanceQuery = balanceQuery.filter((q) =>
        q.eq(q.field("storeId"), args.storeId),
      );
    }

    if (args.paymentProcessor) {
      balanceQuery = balanceQuery.filter((q) =>
        q.eq(q.field("paymentProcessor"), args.paymentProcessor),
      );
    }

    const balance = await balanceQuery.first();
    return balance;
  },
});

// Get all bank accounts
export const getBankAccounts = query({
  args: {
    paymentProcessor: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("bankAccounts"),
      _creationTime: v.number(),
      accountName: v.string(),
      bankName: v.string(),
      accountNumber: v.string(),
      routingNumber: v.string(),
      accountType: v.union(v.literal("checking"), v.literal("savings")),
      address: v.object({
        street1: v.string(),
        street2: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        postalCode: v.string(),
        country: v.string(),
      }),
      status: v.union(
        v.literal("pending_verification"),
        v.literal("verified"),
        v.literal("failed_verification"),
        v.literal("disabled"),
      ),
      isDefault: v.boolean(),
      paymentProcessor: v.string(),
      providerAccountId: v.optional(v.string()),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    let accountsQuery = ctx.db.query("bankAccounts");

    if (args.paymentProcessor) {
      accountsQuery = accountsQuery.filter((q) =>
        q.eq(q.field("paymentProcessor"), args.paymentProcessor),
      );
    }

    if (args.status) {
      accountsQuery = accountsQuery.filter((q) =>
        q.eq(q.field("status"), args.status),
      );
    }

    const accounts = await accountsQuery.collect();
    return accounts;
  },
});

// Get transfer history
export const getTransfers = query({
  args: {
    status: v.optional(v.string()),
    bankAccountId: v.optional(v.id("bankAccounts")),
    paymentProcessor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("transfers"),
      _creationTime: v.number(),
      transferId: v.string(),
      amount: v.number(),
      currency: v.string(),
      bankAccountId: v.id("bankAccounts"),
      paymentProcessor: v.string(),
      processorTransferId: v.optional(v.string()),
      status: v.union(
        v.literal("pending"),
        v.literal("in_transit"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled"),
        v.literal("reversed"),
      ),
      initiatedAt: v.number(),
      expectedArrival: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      fees: v.optional(v.number()),
      description: v.optional(v.string()),
      failureReason: v.optional(v.string()),
      initiatedBy: v.id("users"),
      notes: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    let transfersQuery = ctx.db.query("transfers");

    if (args.status) {
      transfersQuery = transfersQuery.filter((q) =>
        q.eq(q.field("status"), args.status),
      );
    }

    if (args.bankAccountId) {
      transfersQuery = transfersQuery.filter((q) =>
        q.eq(q.field("bankAccountId"), args.bankAccountId),
      );
    }

    if (args.paymentProcessor) {
      transfersQuery = transfersQuery.filter((q) =>
        q.eq(q.field("paymentProcessor"), args.paymentProcessor),
      );
    }

    transfersQuery = transfersQuery.order("desc");

    if (args.limit) {
      transfersQuery = transfersQuery.take(args.limit);
    }

    const transfers = await transfersQuery.collect();
    return transfers;
  },
});

// Get a specific transfer with details using proper junction table
export const getTransferWithDetails = query({
  args: { transferId: v.id("transfers") },
  returns: v.union(
    v.null(),
    v.object({
      transfer: v.object({
        _id: v.id("transfers"),
        _creationTime: v.number(),
        transferId: v.string(),
        amount: v.number(),
        currency: v.string(),
        bankAccountId: v.id("bankAccounts"),
        paymentProcessor: v.string(),
        processorTransferId: v.optional(v.string()),
        status: v.union(
          v.literal("pending"),
          v.literal("in_transit"),
          v.literal("completed"),
          v.literal("failed"),
          v.literal("cancelled"),
          v.literal("reversed"),
        ),
        initiatedAt: v.number(),
        expectedArrival: v.optional(v.number()),
        completedAt: v.optional(v.number()),
        fees: v.optional(v.number()),
        description: v.optional(v.string()),
        failureReason: v.optional(v.string()),
        initiatedBy: v.id("users"),
        notes: v.optional(v.string()),
      }),
      bankAccount: v.object({
        _id: v.id("bankAccounts"),
        accountName: v.string(),
        bankName: v.string(),
        accountNumber: v.string(),
        accountType: v.union(v.literal("checking"), v.literal("savings")),
      }),
      relatedOrders: v.array(
        v.object({
          _id: v.id("orders"),
          _creationTime: v.number(),
          orderId: v.string(),
          customerInfo: v.object({
            firstName: v.string(),
            lastName: v.string(),
            email: v.string(),
          }),
          total: v.number(),
          status: v.string(),
          paymentStatus: v.string(),
          items: v.array(
            v.object({
              productId: v.string(),
              productSnapshot: v.object({
                name: v.string(),
                price: v.number(),
                imageUrl: v.optional(v.string()),
              }),
              quantity: v.number(),
              lineTotal: v.number(),
            }),
          ),
          // Additional fields from the junction table
          orderAmount: v.number(), // Amount contributed by this order to the transfer
          processedAt: v.number(), // When this order was included in the transfer
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const transfer = await ctx.db.get(args.transferId);
    if (!transfer) return null;

    const bankAccount = await ctx.db.get(transfer.bankAccountId);
    if (!bankAccount) return null;

    // Get related orders through the junction table
    const transferOrderLinks = await ctx.db
      .query("transferOrders")
      .withIndex("by_transfer", (q) => q.eq("transferId", args.transferId))
      .collect();

    const relatedOrders = [];
    for (const link of transferOrderLinks) {
      const order = await ctx.db.get(link.orderId);
      if (order) {
        relatedOrders.push({
          _id: order._id,
          _creationTime: order._creationTime,
          orderId: order.orderId,
          customerInfo: order.customerInfo,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          items: order.items,
          // Include junction table metadata
          orderAmount: link.orderAmount,
          processedAt: link.processedAt,
        });
      }
    }

    return {
      transfer,
      bankAccount: {
        _id: bankAccount._id,
        accountName: bankAccount.accountName,
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        accountType: bankAccount.accountType,
      },
      relatedOrders,
    };
  },
});

// Add orders to a transfer (creates the many-to-many relationship)
export const addOrdersToTransfer = mutation({
  args: {
    transferId: v.id("transfers"),
    orderIds: v.array(v.id("orders")),
  },
  returns: v.object({
    success: v.boolean(),
    addedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    let addedCount = 0;

    for (const orderId of args.orderIds) {
      // Check if the relationship already exists
      const existingLink = await ctx.db
        .query("transferOrders")
        .withIndex("by_transfer_and_order", (q) =>
          q.eq("transferId", args.transferId).eq("orderId", orderId),
        )
        .first();

      if (!existingLink) {
        // Get the order to extract its total amount
        const order = await ctx.db.get(orderId);
        if (order) {
          await ctx.db.insert("transferOrders", {
            transferId: args.transferId,
            orderId: orderId,
            orderAmount: order.total,
            processedAt: Date.now(),
          });
          addedCount++;
        }
      }
    }

    return {
      success: true,
      addedCount,
    };
  },
});

// Remove orders from a transfer
export const removeOrdersFromTransfer = mutation({
  args: {
    transferId: v.id("transfers"),
    orderIds: v.array(v.id("orders")),
  },
  returns: v.object({
    success: v.boolean(),
    removedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    let removedCount = 0;

    for (const orderId of args.orderIds) {
      const existingLink = await ctx.db
        .query("transferOrders")
        .withIndex("by_transfer_and_order", (q) =>
          q.eq("transferId", args.transferId).eq("orderId", orderId),
        )
        .first();

      if (existingLink) {
        await ctx.db.delete(existingLink._id);
        removedCount++;
      }
    }

    return {
      success: true,
      removedCount,
    };
  },
});

// Get a specific bank account
export const getBankAccount = query({
  args: { bankAccountId: v.id("bankAccounts") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("bankAccounts"),
      _creationTime: v.number(),
      accountName: v.string(),
      bankName: v.string(),
      accountNumber: v.string(),
      routingNumber: v.string(),
      accountType: v.union(v.literal("checking"), v.literal("savings")),
      address: v.object({
        street1: v.string(),
        street2: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        postalCode: v.string(),
        country: v.string(),
      }),
      status: v.union(
        v.literal("pending_verification"),
        v.literal("verified"),
        v.literal("failed_verification"),
        v.literal("disabled"),
      ),
      isDefault: v.boolean(),
      paymentProcessor: v.string(),
      providerAccountId: v.optional(v.string()),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.bankAccountId);
    return account;
  },
});

// Create a new bank account
export const createBankAccount = mutation({
  args: {
    accountName: v.string(),
    bankName: v.string(),
    accountNumber: v.string(),
    routingNumber: v.string(),
    accountType: v.union(v.literal("checking"), v.literal("savings")),
    address: v.object({
      street1: v.string(),
      street2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      postalCode: v.string(),
      country: v.string(),
    }),
    paymentProcessor: v.string(),
    isDefault: v.optional(v.boolean()),
  },
  returns: v.id("bankAccounts"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // If this is being set as default, unset other defaults
    if (args.isDefault) {
      const existingDefaults = await ctx.db
        .query("bankAccounts")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .collect();

      for (const account of existingDefaults) {
        await ctx.db.patch(account._id, { isDefault: false });
      }
    }

    const now = Date.now();
    return await ctx.db.insert("bankAccounts", {
      accountName: args.accountName,
      bankName: args.bankName,
      accountNumber: args.accountNumber, // Note: Should be encrypted in production
      routingNumber: args.routingNumber,
      accountType: args.accountType,
      address: args.address,
      status: "pending_verification",
      isDefault: args.isDefault ?? false,
      paymentProcessor: args.paymentProcessor,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a bank account
export const updateBankAccount = mutation({
  args: {
    bankAccountId: v.id("bankAccounts"),
    accountName: v.optional(v.string()),
    bankName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    routingNumber: v.optional(v.string()),
    accountType: v.optional(
      v.union(v.literal("checking"), v.literal("savings")),
    ),
    address: v.optional(
      v.object({
        street1: v.string(),
        street2: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        postalCode: v.string(),
        country: v.string(),
      }),
    ),
    status: v.optional(
      v.union(
        v.literal("pending_verification"),
        v.literal("verified"),
        v.literal("failed_verification"),
        v.literal("disabled"),
      ),
    ),
    isDefault: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { bankAccountId, ...updates } = args;

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      const existingDefaults = await ctx.db
        .query("bankAccounts")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .collect();

      for (const account of existingDefaults) {
        if (account._id !== bankAccountId) {
          await ctx.db.patch(account._id, { isDefault: false });
        }
      }
    }

    await ctx.db.patch(bankAccountId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const createTransfer = mutation({
  args: {
    amount: v.number(),
    currency: v.string(),
    bankAccountId: v.id("bankAccounts"),
    paymentProcessor: v.string(),
    description: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id("transfers"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Generate a unique transfer ID
    const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const now = Date.now();
    return await ctx.db.insert("transfers", {
      transferId,
      amount: args.amount,
      currency: args.currency,
      bankAccountId: args.bankAccountId,
      paymentProcessor: args.paymentProcessor,
      status: "pending",
      initiatedAt: now,
      description: args.description,
      initiatedBy: user._id,
      notes: args.notes,
    });
  },
});

// Update balance (typically called by webhook or scheduled function)
export const updateStoreBalance = mutation({
  args: {
    availableBalance: v.number(),
    pendingBalance: v.number(),
    currency: v.string(),
    paymentProcessor: v.string(),
    storeId: v.optional(v.string()),
    storeName: v.optional(v.string()),
    processorAccountId: v.optional(v.string()),
  },
  returns: v.id("storeBalances"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if balance record exists
    let balanceQuery = ctx.db.query("storeBalances");

    if (args.storeId) {
      balanceQuery = balanceQuery.filter((q) =>
        q.eq(q.field("storeId"), args.storeId),
      );
    }

    balanceQuery = balanceQuery.filter((q) =>
      q.eq(q.field("paymentProcessor"), args.paymentProcessor),
    );

    const existingBalance = await balanceQuery.first();

    const now = Date.now();
    const balanceData = {
      availableBalance: args.availableBalance,
      pendingBalance: args.pendingBalance,
      totalBalance: args.availableBalance + args.pendingBalance,
      currency: args.currency,
      storeId: args.storeId,
      storeName: args.storeName,
      lastUpdated: now,
      updatedBy: user._id,
      paymentProcessor: args.paymentProcessor,
      processorAccountId: args.processorAccountId,
    };

    if (existingBalance) {
      await ctx.db.patch(existingBalance._id, balanceData);
      return existingBalance._id as any;
    } else {
      return await ctx.db.insert("storeBalances", balanceData);
    }
  },
});

// Delete a bank account
export const deleteBankAccount = mutation({
  args: { bankAccountId: v.id("bankAccounts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.bankAccountId);
    return null;
  },
});
