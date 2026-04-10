import { db, workspaces } from "@raketech/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc.js";

export const workspaceRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        slug: z
          .string()
          .min(1)
          .max(255)
          .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [workspace] = await db
        .insert(workspaces)
        .values({ name: input.name, slug: input.slug, ownerId: ctx.userId })
        .returning();
      return workspace;
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.slug, input.slug))
        .limit(1);
      return workspace ?? null;
    }),
});
