import { pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.js";

export const featureStatusEnum = pgEnum("feature_status", ["planned", "in_progress", "shipped"]);

export const features = pgTable("features", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: featureStatusEnum("status").notNull().default("planned"),
  internalNotes: text("internal_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Feature = typeof features.$inferSelect;
export type NewFeature = typeof features.$inferInsert;
