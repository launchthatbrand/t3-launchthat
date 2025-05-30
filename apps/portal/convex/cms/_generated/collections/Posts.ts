import type { CollectionConfig } from 'payload';

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title"
  },
  access: {
    read: () => true,
    create: ({ req }) => true,
    update: ({ req }) => true,
    delete: ({ req }) => true
  },
  fields: [
    {
      name: "title",
      required: true,
      type: "text"
    },
    {
      name: "content",
      required: true,
      type: "text"
    }
  ],
  timestamps: true,
  auth: undefined,
  indexes: undefined
};
