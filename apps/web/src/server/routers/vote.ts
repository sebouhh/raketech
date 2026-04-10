import { db, votes } from "@raketech/db";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc.js";

export const voteRouter = createTRPCRouter({
  cast: publicProcedure
    .input(
      z.object({
        featureId: z.string().uuid(),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Dedup via DB: one vote per IP per feature
      const existing = await db
        .select({ id: votes.id })
        .from(votes)
        .where(and(eq(votes.featureId, input.featureId), eq(votes.ip, ctx.ip)))
        .limit(1);

      if (existing.length > 0) {
        return { success: false, alreadyVoted: true };
      }

      const [vote] = await db
        .insert(votes)
        .values({ featureId: input.featureId, ip: ctx.ip, email: input.email })
        .returning();

      return { success: true, alreadyVoted: false, vote };
    }),

  count: publicProcedure
    .input(z.object({ featureId: z.string().uuid() }))
    .query(async ({ input }) => {
      const [result] = await db
        .select({ count: count() })
        .from(votes)
        .where(eq(votes.featureId, input.featureId));
      return { count: result?.count ?? 0 };
    }),
});
