"use client";

import { useState } from "react";
import { EmailCaptureModal } from "./EmailCaptureModal";
import { VoteButton } from "./VoteButton";
import { trpc } from "@/trpc/client";

interface FeatureCardProps {
  id: string;
  title: string;
  description: string | null;
  voteCount: number;
}

export function FeatureCard({ id, title, description, voteCount }: FeatureCardProps) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const utils = trpc.useUtils();

  const handleVoted = () => {
    setShowEmailModal(true);
  };

  const handleEmailSubmit = async (email: string) => {
    // Re-cast vote with email for notification eligibility
    // The dedup key will already exist so this won't double-count,
    // but we need a separate mechanism; for MVP we just close the modal.
    void email;
  };

  const handleModalClose = () => {
    setShowEmailModal(false);
    // Refresh feature list after voting
    void utils.feature.list.invalidate();
  };

  return (
    <>
      <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4 shadow-sm hover:shadow-md transition-shadow">
        <VoteButton featureId={id} voteCount={voteCount} onVoted={handleVoted} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2">{title}</h3>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{description}</p>
          )}
        </div>
      </div>

      {showEmailModal && (
        <EmailCaptureModal
          featureId={id}
          onClose={handleModalClose}
          onSubmit={handleEmailSubmit}
        />
      )}
    </>
  );
}
