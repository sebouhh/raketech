import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { features } from "./features.js";

export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  featureId: uuid("feature_id")
    .notNull()
    .references(() => features.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }),
  ip: varchar("ip", { length: 45 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
