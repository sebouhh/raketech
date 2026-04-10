"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@raketech/ui";
import { FeatureCard } from "@/components/FeatureCard";
import { SubmitRequestModal } from "@/components/SubmitRequestModal";
import { trpc } from "@/trpc/client";

const COLUMNS = [
  { key: "planned", label: "Planned" },
  { key: "in_progress", label: "In Progress" },
  { key: "shipped", label: "Shipped" },
] as const;

interface RoadmapBoardProps {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
}

export function RoadmapBoard({ workspaceId, workspaceName, workspaceSlug }: RoadmapBoardProps) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const { data: features = [], refetch } = trpc.feature.list.useQuery(
    { workspaceId },
    { refetchInterval: 30_000 },
  );

  const handleSubmitted = () => {
    void refetch();
  };

  const byStatus = (status: (typeof COLUMNS)[number]["key"]) =>
    features.filter((f) => f.status === status);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{workspaceName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Public roadmap</p>
          </div>
          <Button size="sm" onClick={() => setShowSubmitModal(true)}>
            Submit a request
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {COLUMNS.map(({ key, label }) => {
            const items = byStatus(key);
            return (
              <section key={key} aria-labelledby={`col-${key}`}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 id={`col-${key}`} className="text-sm font-semibold uppercase tracking-wide">
                    {label}
                  </h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {items.length}
                  </span>
                  {key === "shipped" && items.length > 0 && (
                    <Link
                      href={`/${workspaceSlug}/changelog`}
                      className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      View changelog →
                    </Link>
                  )}
                </div>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                      Nothing here yet
                    </p>
                  ) : (
                    items.map((feature) => (
                      <FeatureCard
                        key={feature.id}
                        id={feature.id}
                        title={feature.title}
                        description={feature.description ?? null}
                        voteCount={feature.voteCount}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {showSubmitModal && (
        <SubmitRequestModal
          workspaceId={workspaceId}
          onClose={() => setShowSubmitModal(false)}
          onSubmitted={handleSubmitted}
        />
      )}
    </div>
  );
}
