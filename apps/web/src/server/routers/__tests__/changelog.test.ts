// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDb, chain } = vi.hoisted(() => {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    values: vi.fn(),
    returning: vi.fn(),
    set: vi.fn(),
    orderBy: vi.fn(),
  };
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.values.mockReturnValue(chain);
  chain.set.mockReturnValue(chain);

  const mockDb = {
    select: vi.fn().mockReturnValue(chain),
    insert: vi.fn().mockReturnValue(chain),
    update: vi.fn().mockReturnValue(chain),
    delete: vi.fn().mockReturnValue(chain),
  };
  return { mockDb, chain };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: null }),
}));

vi.mock("@raketech/db", () => ({
  db: mockDb,
  workspaces: {},
  features: {
    title: "features.title",
    description: "features.description",
  },
  votes: {},
  changelogEntries: {
    id: "changelogEntries.id",
    featureId: "changelogEntries.featureId",
    workspaceId: "changelogEntries.workspaceId",
    createdAt: "changelogEntries.createdAt",
  },
}));

import { createCallerFactory } from "@/server/trpc";
import { changelogRouter } from "../changelog";

const createCaller = createCallerFactory(changelogRouter);

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const mockEntry = {
  id: "entry-uuid-1",
  featureId: "00000000-0000-0000-0000-000000000002",
  workspaceId: WORKSPACE_ID,
  createdAt: new Date("2026-01-15"),
  featureTitle: "Dark mode",
  featureDescription: "Add dark mode support",
};

beforeEach(() => {
  vi.clearAllMocks();
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.values.mockReturnValue(chain);
  chain.set.mockReturnValue(chain);
  mockDb.select.mockReturnValue(chain);
  mockDb.insert.mockReturnValue(chain);
  mockDb.update.mockReturnValue(chain);
  mockDb.delete.mockReturnValue(chain);
});

describe("changelog.list", () => {
  it("returns changelog entries ordered by date descending", async () => {
    chain.orderBy.mockResolvedValue([mockEntry]);
    const caller = createCaller({ userId: null, ip: "127.0.0.1" });

    const result = await caller.list({ workspaceId: WORKSPACE_ID });

    expect(mockDb.select).toHaveBeenCalled();
    expect(result).toEqual([mockEntry]);
  });

  it("returns empty array when no entries exist", async () => {
    chain.orderBy.mockResolvedValue([]);
    const caller = createCaller({ userId: null, ip: "127.0.0.1" });

    const result = await caller.list({ workspaceId: WORKSPACE_ID });

    expect(result).toEqual([]);
  });

  it("is publicly accessible without authentication", async () => {
    chain.orderBy.mockResolvedValue([mockEntry]);
    const caller = createCaller({ userId: null, ip: "127.0.0.1" });

    await expect(caller.list({ workspaceId: WORKSPACE_ID })).resolves.toBeDefined();
  });
});
