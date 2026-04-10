"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@raketech/ui";
import { trpc } from "@/trpc/client";

interface SubmitRequestModalProps {
  workspaceId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function SubmitRequestModal({
  workspaceId,
  onClose,
  onSubmitted,
}: SubmitRequestModalProps) {
  const { isSignedIn } = useUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const createFeature = trpc.feature.create.useMutation({
    onSuccess() {
      onSubmitted();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createFeature.mutate({
      workspaceId,
      title: title.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-modal-title"
    >
      <div className="bg-background border border-border rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 id="submit-modal-title" className="text-lg font-semibold mb-1">
          Submit a feature request
        </h2>

        {!isSignedIn ? (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              You need to sign in to submit a feature request.
            </p>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <SignInButton>
                <Button size="sm">Sign in to submit</Button>
              </SignInButton>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-1">
              <label htmlFor="feature-title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id="feature-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What feature would you like?"
                maxLength={500}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="feature-description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="feature-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give us more context (optional)"
                maxLength={2000}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            {createFeature.error && (
              <p className="text-sm text-destructive">{createFeature.error.message}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!title.trim() || createFeature.isPending}
              >
                {createFeature.isPending ? "Submitting…" : "Submit request"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
