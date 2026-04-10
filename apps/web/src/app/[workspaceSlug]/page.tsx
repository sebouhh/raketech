import { notFound } from "next/navigation";
import { createCallerFactory, createTRPCContext } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import { RoadmapBoard } from "./RoadmapBoard";

const createCaller = createCallerFactory(appRouter);

interface Props {
  params: Promise<{ workspaceSlug: string }>;
}

export default async function WorkspaceRoadmapPage({ params }: Props) {
  const { workspaceSlug } = await params;

  const ctx = await createTRPCContext();
  const caller = createCaller(ctx);
  const workspace = await caller.workspace.getBySlug({ slug: workspaceSlug });

  if (!workspace) {
    notFound();
  }

  return <RoadmapBoard workspaceId={workspace.id} workspaceName={workspace.name} />;
}

export async function generateMetadata({ params }: Props) {
  const { workspaceSlug } = await params;

  const ctx = await createTRPCContext();
  const caller = createCaller(ctx);
  const workspace = await caller.workspace.getBySlug({ slug: workspaceSlug });

  if (!workspace) return {};

  return {
    title: `${workspace.name} — Public Roadmap`,
    description: `See what ${workspace.name} is building next and vote on features.`,
  };
}
