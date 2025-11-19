import { authRouter } from "./router/auth";
import { contactsRouter } from "./router/contacts";
import { postRouter } from "./router/post";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  contacts: contactsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
