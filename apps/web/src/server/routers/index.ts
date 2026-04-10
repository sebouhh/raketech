import { createTRPCRouter } from "../trpc.js";

export const appRouter = createTRPCRouter({
  // Add routers here as the app grows
  // e.g.: users: usersRouter,
});

export type AppRouter = typeof appRouter;
