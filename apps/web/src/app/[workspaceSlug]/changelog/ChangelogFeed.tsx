"use client";

import Link from "next/link";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import type { AppRouter } from "@/server/routers/index";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type ChangelogEntry = RouterOutputs["changelog"]["list"][number];

interface ChangelogFeedProps {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  initialEntries: ChangelogEntry[];
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatMonth(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

function groupByMonth(entries: ChangelogEntry[]): Map<string, ChangelogEntry[]> {
  const groups = new Map<string, ChangelogEntry[]>();
  for (const entry of entries) {
    const month = formatMonth(entry.createdAt);
    if (!groups.has(month)) {
      groups.set(month, []);
    }
    groups.get(month)!.push(entry);
  }
  return groups;
}

export function ChangelogFeed({
  workspaceId,
  workspaceName,
  workspaceSlug,
  initialEntries,
}: ChangelogFeedProps) {
  const { data: entries = initialEntries } = trpc.changelog.list.useQuery(
    { workspaceId },
    { refetchInterval: 60_000 },
  );

  const grouped = groupByMonth(entries);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-2xl px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{workspaceName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Changelog</p>
          </div>
          <Link
            href={`/${workspaceSlug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to roadmap
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        {entries.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground text-sm">No shipped features yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Array.from(grouped.entries()).map(([month, monthEntries]) => (
              <section key={month}>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
                  {month}
                </h2>
                <div className="space-y-6">
                  {monthEntries.map((entry) => (
                    <article
                      key={entry.id}
                      className="border border-border rounded-lg bg-background p-5 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              Shipped
                            </span>
                            <time
                              dateTime={new Date(entry.createdAt).toISOString()}
                              className="text-xs text-muted-foreground"
                            >
                              {formatDate(entry.createdAt)}
                            </time>
                          </div>
                          <h3 className="text-base font-semibold leading-snug">
                            {entry.featureTitle}
                          </h3>
                          {entry.featureDescription && (
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                              {entry.featureDescription}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
