import type { CollectionConfig } from 'payload';

export const Transactions: CollectionConfig = {
  slug: "transactions",
  admin: {
    useAsTitle: "paymentMethod"
  },
  access: {
    read: () => true,
    create: ({ req }) => true,
    update: ({ req }) => true,
    delete: ({ req }) => true
  },
  fields: [
    {
      name: "status",
      required: true,
      type: "select",
      options: [
        {
          label: "pending",
          value: "pending"
        },
        {
          label: "succeeded",
          value: "succeeded"
        },
        {
          label: "failed",
          value: "failed"
        }
      ],
      defaultValue: "pending"
    },
    {
      name: "amount",
      required: true,
      type: "number"
    },
    {
      name: "paymentMethod",
      required: true,
      type: "text"
    },
    {
      name: "authNetTransactionId",
      required: false,
      type: "text"
    },
    {
      name: "opaqueDataDescriptor",
      required: false,
      type: "text"
    },
    {
      name: "errorMessage",
      required: false,
      type: "text"
    },
    {
      name: "userId",
      required: false,
      type: "relationship",
      relationTo: "users",
      hasMany: false
    },
    {
      name: "orderId",
      required: false,
      type: "text"
    },
    {
      name: "lineItems",
      required: true,
      type: "array",
      fields: [
        {
          name: "item",
          required: true,
          type: "json"
        }
      ]
    }
  ],
  timestamps: true,
  auth: undefined,
  indexes: undefined
};
