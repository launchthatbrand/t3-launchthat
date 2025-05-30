import type { CollectionConfig, PayloadHandler, PayloadRequest } from "payload";
import { Response } from "express";
import { loginOperation } from "payload";

import { authenticated } from "../../access/authenticated";
import { loginHandler } from "./loginHandler";
import meHook from "./meHook";

export const Users: CollectionConfig = {
  slug: "users",
  hooks: {
    beforeLogin: [
      async ({ req, data }) => {
        console.log("beforeLogin");
      },
    ],
    beforeOperation: [
      async ({ req, data }) => {
        console.log("beforeOperation");
        console.log("req.headers", req.headers);
        console.log("req.body", req.body);
        console.log("req.cookies", req.cookies);
        console.log("req.user", req.user);
        console.log("data", data);
      },
    ],
    beforeChange: [
      async ({ req, data }) => {
        console.log("beforeChange");
      },
    ],
    beforeRead: [
      async ({ req, data }) => {
        console.log("beforeRead");
      },
    ],
    me: [meHook],
  },
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ["name", "email"],
    useAsTitle: "name",
  },
  auth: true,
  // auth: {
  //   strategies: [
  //     {
  //       name: 'custom-strategy',
  //       authenticate: ({ payload, headers }) => {
  //         console.log('headers set-cookie', headers)
  //         console.log('INIT CUSTOM STRATEGY')
  //         return {
  //           // user: {
  //           //   id: 'dev-user-123',
  //           //   name: 'Desmond Tatilian',
  //           //   updatedAt: '2025-04-07T20:20:39.581Z',
  //           //   createdAt: '2025-03-25T18:52:49.195Z',
  //           //   email: 'dev@gmail.com',
  //           //   collection: 'users',
  //           //   _strategy: 'mock-user',
  //           //   loginAttempts: 0,
  //           //   role: 'admin',
  //           //   _verified: true,
  //           // },
  //           // user: null,
  //           responseHeaders: new Headers(),
  //         }
  //       },
  //     },
  //   ],
  // },

  // Instead of using endpoints in auth.strategies which is not supported by TypeScript types,
  // we can use a custom endpoint at the collection level
  // endpoints: [
  //   {
  //     path: '/login',
  //     method: 'post',

  //     handler: loginHandler,
  //   },
  // ],
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
  timestamps: true,
};
