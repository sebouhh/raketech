import { createCallerFactory, createTRPCContext } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import { SettingsForm } from "./SettingsForm";

const createCaller = createCallerFactory(appRouter);

export const metadata = {
  title: "Settings — RakeTech Dashboard",
};

export default async function SettingsPage() {
  const ctx = await createTRPCContext();
  const caller = createCaller(ctx);
  const workspace = await caller.workspace.getMine();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="text-2xl font-bold mb-8">Workspace settings</h1>
        <SettingsForm workspace={workspace} />
      </div>
    </main>
  );
}
