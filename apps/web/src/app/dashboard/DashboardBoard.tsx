"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@raketech/ui";
import { trpc } from "@/trpc/client";

type FeatureStatus = "planned" | "in_progress" | "shipped";

type SortKey = "votes" | "createdAt" | "status";

const COLUMNS: { key: FeatureStatus; label: string }[] = [
  { key: "planned", label: "Planned" },
  { key: "in_progress", label: "In Progress" },
  { key: "shipped", label: "Shipped" },
];

const STATUS_ORDER: Record<FeatureStatus, number> = {
  planned: 0,
  in_progress: 1,
  shipped: 2,
};

interface Feature {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  status: FeatureStatus;
  internalNotes: string | null;
  voteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardBoardProps {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  initialFeatures: Feature[];
}

export function DashboardBoard({
  workspaceId,
  workspaceName,
  workspaceSlug,
  initialFeatures,
}: DashboardBoardProps) {
  const [sortKey, setSortKey] = useState<SortKey>("votes");
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const { data: features = initialFeatures, refetch } = trpc.feature.listForDashboard.useQuery(
    { workspaceId },
    { initialData: initialFeatures, refetchInterval: 30_000 },
  );

  const updateStatus = trpc.feature.updateStatus.useMutation({
    onSuccess: () => void refetch(),
  });

  const updateNotes = trpc.feature.updateNotes.useMutation({
    onSuccess: () => {
      setExpandedNotes(null);
      void refetch();
    },
  });

  const sorted = [...features].sort((a, b) => {
    if (sortKey === "votes") return b.voteCount - a.voteCount;
    if (sortKey === "createdAt")
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  });

  const byStatus = (status: FeatureStatus) => sorted.filter((f) => f.status === status);

  const handleStatusChange = (id: string, newStatus: FeatureStatus) => {
    updateStatus.mutate({ id, status: newStatus });
  };

  const handleNotesSave = (featureId: string) => {
    const notes = notesDraft[featureId] ?? "";
    updateNotes.mutate({ id: featureId, internalNotes: notes });
  };

  const openNotes = (feature: Feature) => {
    setNotesDraft((d) => ({ ...d, [feature.id]: feature.internalNotes ?? "" }));
    setExpandedNotes(feature.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-bold">{workspaceName}</h1>
              <p className="text-xs text-muted-foreground">
                Public roadmap:{" "}
                <Link
                  href={`/${workspaceSlug}`}
                  className="underline hover:text-foreground"
                  target="_blank"
                >
                  /{workspaceSlug}
                </Link>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Sort controls */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          {(["votes", "createdAt", "status"] as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortKey(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                sortKey === key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {key === "votes" ? "Votes" : key === "createdAt" ? "Date added" : "Status"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {COLUMNS.map(({ key, label }) => {
            const items = byStatus(key);
            return (
              <section key={key} aria-labelledby={`col-${key}`}>
                <div className="mb-3 flex items-center gap-2">
                  <h2
                    id={`col-${key}`}
                    className="text-sm font-semibold uppercase tracking-wide"
                  >
                    {label}
                  </h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border py-4 text-center text-xs text-muted-foreground">
                      Nothing here yet
                    </p>
                  ) : (
                    items.map((feature) => (
                      <DashboardFeatureCard
                        key={feature.id}
                        feature={feature}
                        currentStatus={key}
                        isNotesOpen={expandedNotes === feature.id}
                        notesDraft={notesDraft[feature.id] ?? feature.internalNotes ?? ""}
                        onNotesDraftChange={(val) =>
                          setNotesDraft((d) => ({ ...d, [feature.id]: val }))
                        }
                        onOpenNotes={() => openNotes(feature)}
                        onCloseNotes={() => setExpandedNotes(null)}
                        onSaveNotes={() => handleNotesSave(feature.id)}
                        onStatusChange={(newStatus) =>
                          handleStatusChange(feature.id, newStatus)
                        }
                        isSavingNotes={
                          updateNotes.isPending && updateNotes.variables?.id === feature.id
                        }
                        isChangingStatus={
                          updateStatus.isPending && updateStatus.variables?.id === feature.id
                        }
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

interface DashboardFeatureCardProps {
  feature: Feature;
  currentStatus: FeatureStatus;
  isNotesOpen: boolean;
  notesDraft: string;
  onNotesDraftChange: (val: string) => void;
  onOpenNotes: () => void;
  onCloseNotes: () => void;
  onSaveNotes: () => void;
  onStatusChange: (newStatus: FeatureStatus) => void;
  isSavingNotes: boolean;
  isChangingStatus: boolean;
}

function DashboardFeatureCard({
  feature,
  currentStatus,
  isNotesOpen,
  notesDraft,
  onNotesDraftChange,
  onOpenNotes,
  onCloseNotes,
  onSaveNotes,
  onStatusChange,
  isSavingNotes,
  isChangingStatus,
}: DashboardFeatureCardProps) {
  const nextStatuses: FeatureStatus[] = (["planned", "in_progress", "shipped"] as const).filter(
    (s) => s !== currentStatus,
  );

  const statusLabel: Record<FeatureStatus, string> = {
    planned: "Planned",
    in_progress: "In Progress",
    shipped: "Shipped",
  };

  return (
    <div className="rounded-lg border border-border bg-background p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-snug">{feature.title}</h3>
          {feature.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {feature.description}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          ▲ {feature.voteCount}
        </span>
      </div>

      {/* Status change buttons */}
      <div className="flex flex-wrap gap-1.5">
        {nextStatuses.map((s) => (
          <button
            key={s}
            type="button"
            disabled={isChangingStatus}
            onClick={() => onStatusChange(s)}
            className="rounded border border-border px-2 py-0.5 text-xs hover:bg-muted disabled:opacity-50 transition-colors"
          >
            {isChangingStatus ? "Moving…" : `→ ${statusLabel[s]}`}
          </button>
        ))}
        <button
          type="button"
          onClick={isNotesOpen ? onCloseNotes : onOpenNotes}
          className="ml-auto rounded border border-border px-2 py-0.5 text-xs hover:bg-muted transition-colors"
        >
          {isNotesOpen ? "Hide notes" : feature.internalNotes ? "Edit notes" : "Add notes"}
        </button>
      </div>

      {/* Internal notes inline editor */}
      {isNotesOpen && (
        <div className="space-y-2">
          <textarea
            value={notesDraft}
            onChange={(e) => onNotesDraftChange(e.target.value)}
            placeholder="Internal notes (not visible publicly)…"
            rows={3}
            className="w-full rounded border border-border bg-muted/30 px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCloseNotes}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <Button size="sm" onClick={onSaveNotes} disabled={isSavingNotes}>
              {isSavingNotes ? "Saving…" : "Save notes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
