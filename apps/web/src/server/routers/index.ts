import { createTRPCRouter } from "../trpc.js";
import { changelogRouter } from "./changelog.js";
import { featureRouter } from "./feature.js";
import { voteRouter } from "./vote.js";
import { workspaceRouter } from "./workspace.js";

export const appRouter = createTRPCRouter({
  workspace: workspaceRouter,
  feature: featureRouter,
  vote: voteRouter,
  changelog: changelogRouter,
});

export type AppRouter = typeof appRouter;
