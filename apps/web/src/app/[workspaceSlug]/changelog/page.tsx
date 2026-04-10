import { notFound } from "next/navigation";
import { createCallerFactory, createTRPCContext } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import { ChangelogFeed } from "./ChangelogFeed";

const createCaller = createCallerFactory(appRouter);

interface Props {
  params: Promise<{ workspaceSlug: string }>;
}

export default async function ChangelogPage({ params }: Props) {
  const { workspaceSlug } = await params;

  const ctx = await createTRPCContext();
  const caller = createCaller(ctx);
  const workspace = await caller.workspace.getBySlug({ slug: workspaceSlug });

  if (!workspace) {
    notFound();
  }

  const initialEntries = await caller.changelog.list({ workspaceId: workspace.id });

  return (
    <ChangelogFeed
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      workspaceSlug={workspaceSlug}
      initialEntries={initialEntries}
    />
  );
}

export async function generateMetadata({ params }: Props) {
  const { workspaceSlug } = await params;

  const ctx = await createTRPCContext();
  const caller = createCaller(ctx);
  const workspace = await caller.workspace.getBySlug({ slug: workspaceSlug });

  if (!workspace) return {};

  return {
    title: `${workspace.name} — Changelog`,
    description: `See what ${workspace.name} has shipped recently.`,
  };
}
