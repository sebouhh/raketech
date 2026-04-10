"use client";

import { useState } from "react";
import { Button } from "@raketech/ui";
import { trpc } from "@/trpc/client";

interface VoteButtonProps {
  featureId: string;
  voteCount: number;
  onVoted?: () => void;
}

export function VoteButton({ featureId, voteCount, onVoted }: VoteButtonProps) {
  const [optimisticCount, setOptimisticCount] = useState(voteCount);
  const [hasVoted, setHasVoted] = useState(false);
  const [showDupeMessage, setShowDupeMessage] = useState(false);

  const castVote = trpc.vote.cast.useMutation({
    onSuccess(data) {
      if (data.alreadyVoted) {
        setShowDupeMessage(true);
        setTimeout(() => setShowDupeMessage(false), 3000);
        return;
      }
      setHasVoted(true);
      setOptimisticCount((c) => c + 1);
      onVoted?.();
    },
  });

  const handleClick = () => {
    if (hasVoted || castVote.isPending) return;
    castVote.mutate({ featureId });
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant={hasVoted ? "secondary" : "outline"}
        size="sm"
        onClick={handleClick}
        disabled={hasVoted || castVote.isPending}
        className="flex items-center gap-1 min-w-[56px]"
        aria-label={hasVoted ? "Already voted" : "Upvote this feature"}
      >
        <span aria-hidden="true">{hasVoted ? "✓" : "▲"}</span>
        <span>{optimisticCount}</span>
      </Button>
      {showDupeMessage && (
        <p className="text-xs text-muted-foreground" role="status">
          Already voted
        </p>
      )}
    </div>
  );
}
