"use client";

import { useState } from "react";
import { Button } from "@raketech/ui";

interface EmailCaptureModalProps {
  featureId: string;
  onClose: () => void;
  onSubmit: (email: string) => void;
}

export function EmailCaptureModal({ onClose, onSubmit }: EmailCaptureModalProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onSubmit(email);
      setSubmitted(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-modal-title"
    >
      <div className="bg-background border border-border rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
        {submitted ? (
          <div className="text-center space-y-3">
            <p className="text-lg font-semibold">You&apos;re in!</p>
            <p className="text-sm text-muted-foreground">
              We&apos;ll email you when this ships.
            </p>
            <Button onClick={onClose} size="sm" variant="outline">
              Close
            </Button>
          </div>
        ) : (
          <>
            <h2 id="email-modal-title" className="text-lg font-semibold mb-1">
              Get notified when this ships
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Drop your email and we&apos;ll let you know when this feature is live.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Email address"
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Skip
                </Button>
                <Button type="submit" size="sm" disabled={!email}>
                  Notify me
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
