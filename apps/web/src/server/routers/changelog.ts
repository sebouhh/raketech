import { changelogEntries, db, features } from "@raketech/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc.js";

export const changelogRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ workspaceId: z.string().uuid() }))
    .query(async ({ input }) => {
      return db
        .select({
          id: changelogEntries.id,
          featureId: changelogEntries.featureId,
          workspaceId: changelogEntries.workspaceId,
          createdAt: changelogEntries.createdAt,
          featureTitle: features.title,
          featureDescription: features.description,
        })
        .from(changelogEntries)
        .innerJoin(features, eq(changelogEntries.featureId, features.id))
        .where(eq(changelogEntries.workspaceId, input.workspaceId))
        .orderBy(desc(changelogEntries.createdAt));
    }),
});
