import { db, votes } from "@raketech/db";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { redis } from "../redis.js";
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
      const dedupKey = `vote:${input.featureId}:${ctx.ip}`;
      const alreadyVoted = await redis.exists(dedupKey);

      if (alreadyVoted) {
        return { success: false, alreadyVoted: true };
      }

      const [vote] = await db
        .insert(votes)
        .values({ featureId: input.featureId, ip: ctx.ip, email: input.email })
        .returning();

      // 1-year TTL for dedup key
      await redis.set(dedupKey, "1", { ex: 60 * 60 * 24 * 365 });

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
