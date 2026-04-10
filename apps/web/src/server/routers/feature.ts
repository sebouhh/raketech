import { db, features, votes } from "@raketech/db";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc.js";

const featureStatusSchema = z.enum(["planned", "in_progress", "shipped"]);

export const featureRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ workspaceId: z.string().uuid() }))
    .query(async ({ input }) => {
      return db
        .select({
          id: features.id,
          workspaceId: features.workspaceId,
          title: features.title,
          description: features.description,
          status: features.status,
          createdAt: features.createdAt,
          updatedAt: features.updatedAt,
          voteCount: count(votes.id),
        })
        .from(features)
        .leftJoin(votes, eq(votes.featureId, features.id))
        .where(eq(features.workspaceId, input.workspaceId))
        .groupBy(
          features.id,
          features.workspaceId,
          features.title,
          features.description,
          features.status,
          features.createdAt,
          features.updatedAt,
        )
        .orderBy(desc(count(votes.id)));
    }),

  create: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        title: z.string().min(1).max(500),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [feature] = await db
        .insert(features)
        .values({
          workspaceId: input.workspaceId,
          title: input.title,
          description: input.description,
          status: "planned",
        })
        .returning();
      return feature;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: featureStatusSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const [feature] = await db
        .update(features)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(features.id, input.id))
        .returning();
      return feature;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db.delete(features).where(eq(features.id, input.id));
      return { success: true };
    }),
});
