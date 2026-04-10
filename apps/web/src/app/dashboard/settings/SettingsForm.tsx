"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@raketech/ui";
import { trpc } from "@/trpc/client";

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface SettingsFormProps {
  workspace: Workspace | null;
}

export function SettingsForm({ workspace }: SettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(workspace?.name ?? "");
  const [slug, setSlug] = useState(workspace?.slug ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWorkspace = trpc.workspace.create.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.push("/dashboard");
    },
    onError: (e) => setError(e.message),
  });

  const updateWorkspace = trpc.workspace.update.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e) => setError(e.message),
  });

  const isPending = createWorkspace.isPending || updateWorkspace.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (workspace) {
      updateWorkspace.mutate({ id: workspace.id, name, slug });
    } else {
      createWorkspace.mutate({ name, slug });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {workspace && (
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to dashboard
          </Link>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium">
          Workspace name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
          maxLength={255}
          placeholder="My Product"
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="slug" className="block text-sm font-medium">
          Public URL slug
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">raketech.app/</span>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            required
            minLength={1}
            maxLength={255}
            pattern="^[a-z0-9-]+$"
            placeholder="my-product"
            className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground">Lowercase letters, numbers and hyphens only.</p>
      </div>

      {error && (
        <p className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {saved && (
        <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          Settings saved!
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : workspace ? "Save changes" : "Create workspace"}
      </Button>
    </form>
  );
}
