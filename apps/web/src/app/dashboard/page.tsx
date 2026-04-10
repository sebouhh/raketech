import { redirect } from "next/navigation";
import { createCallerFactory, createTRPCContext } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import { DashboardBoard } from "./DashboardBoard";

const createCaller = createCallerFactory(appRouter);

export const metadata = {
  title: "Dashboard — RakeTech",
};

export default async function DashboardPage() {
  const ctx = await createTRPCContext();
  const caller = createCaller(ctx);

  const workspace = await caller.workspace.getMine();

  if (!workspace) {
    // No workspace yet — redirect to create one (or show onboarding)
    redirect("/dashboard/settings");
  }

  const features = await caller.feature.list({ workspaceId: workspace.id });

  return (
    <DashboardBoard
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      workspaceSlug={workspace.slug}
      initialFeatures={features}
    />
  );
}
