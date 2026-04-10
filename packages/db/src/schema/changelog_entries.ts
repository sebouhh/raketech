import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { features } from "./features.js";
import { workspaces } from "./workspaces.js";

export const changelogEntries = pgTable("changelog_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  featureId: uuid("feature_id")
    .notNull()
    .references(() => features.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ChangelogEntry = typeof changelogEntries.$inferSelect;
export type NewChangelogEntry = typeof changelogEntries.$inferInsert;
