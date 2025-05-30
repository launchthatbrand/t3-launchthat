import path from "path";
import { fileURLToPath } from "url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { clerkAuthPlugin } from "@acme/payload-clerk";
import { dataSyncPlugin } from "@acme/payload-datasync";

import { seed } from "./seed.js";
import { Users } from "./src/collections/Users/index.js";
import { devUser } from "./src/helpers/credentials.js";
import { testEmailAdapter } from "./src/helpers/testEmailAdapter.js";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname;
}

export default buildConfig({
  debug: true,
  admin: {
    autoLogin: devUser,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: "posts",
      fields: [],
    },
    {
      slug: "media",
      fields: [],
      upload: {
        staticDir: path.resolve(dirname, "media"),
      },
    },
    Users,
  ],
  db: postgresAdapter({
    migrationDir: path.resolve(dirname, "./migrations"),
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
  editor: lexicalEditor(),
  email: testEmailAdapter,
  onInit: async (payload) => {
    await seed(payload);
  },
  plugins: [
    // templatePlugin({
    //   collections: {
    //     posts: true,
    //   },
    // }),
    // clerkAuthPlugin({
    //   debug: true,
    // }),
    // dataSyncPlugin({
    //   defaults: {
    //     githubSource: {
    //       apiKey: "test-api-key",
    //     },
    //   },
    //   collections: {
    //     posts: true,
    //     media: true,
    //     users: true,
    //   },
    // }),
  ],
  secret: process.env.PAYLOAD_SECRET || "test-secret_key",
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
