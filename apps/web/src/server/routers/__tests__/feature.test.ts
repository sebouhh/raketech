// @vitest-environment node
import { TRPCError } from "@trpc/server";
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
    leftJoin: vi.fn(),
    groupBy: vi.fn(),
  };
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.values.mockReturnValue(chain);
  chain.set.mockReturnValue(chain);
  chain.leftJoin.mockReturnValue(chain);
  chain.groupBy.mockReturnValue(chain);

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
    id: "features.id",
    workspaceId: "features.workspaceId",
    title: "features.title",
    description: "features.description",
    status: "features.status",
    createdAt: "features.createdAt",
    updatedAt: "features.updatedAt",
  },
  votes: { id: "votes.id", featureId: "votes.featureId" },
  changelogEntries: {},
}));

import { createCallerFactory } from "@/server/trpc";
import { featureRouter } from "../feature";

const createCaller = createCallerFactory(featureRouter);

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";
const FEATURE_ID = "00000000-0000-0000-0000-000000000002";

const mockFeature = {
  id: FEATURE_ID,
  workspaceId: WORKSPACE_ID,
  title: "Dark mode",
  description: "Add dark mode support",
  status: "planned" as const,
  internalNotes: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  voteCount: 0,
};

const ctx = { userId: null as string | null, ip: "127.0.0.1" };

beforeEach(() => {
  vi.clearAllMocks();
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.values.mockReturnValue(chain);
  chain.set.mockReturnValue(chain);
  chain.leftJoin.mockReturnValue(chain);
  chain.groupBy.mockReturnValue(chain);
  mockDb.select.mockReturnValue(chain);
  mockDb.insert.mockReturnValue(chain);
  mockDb.update.mockReturnValue(chain);
  mockDb.delete.mockReturnValue(chain);
});

describe("feature.list", () => {
  it("lists features for a workspace", async () => {
    chain.orderBy.mockResolvedValue([mockFeature]);
    const caller = createCaller(ctx);

    const result = await caller.list({ workspaceId: WORKSPACE_ID });

    expect(mockDb.select).toHaveBeenCalled();
    expect(result).toEqual([mockFeature]);
  });

  it("returns empty array when no features exist", async () => {
    chain.orderBy.mockResolvedValue([]);
    const caller = createCaller(ctx);

    const result = await caller.list({ workspaceId: WORKSPACE_ID });

    expect(result).toEqual([]);
  });
});

describe("feature.create", () => {
  it("creates a feature with planned status by default", async () => {
    chain.returning.mockResolvedValue([mockFeature]);
    const caller = createCaller({ userId: "user_abc", ip: "127.0.0.1" });

    const result = await caller.create({
      workspaceId: WORKSPACE_ID,
      title: "Dark mode",
      description: "Add dark mode support",
    });

    expect(mockDb.insert).toHaveBeenCalled();
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ status: "planned", title: "Dark mode" }),
    );
    expect(result).toEqual(mockFeature);
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const caller = createCaller(ctx);

    await expect(
      caller.create({ workspaceId: WORKSPACE_ID, title: "Dark mode" }),
    ).rejects.toThrow(TRPCError);
  });
});

describe("feature.updateStatus", () => {
  it("updates a feature status", async () => {
    const updated = { ...mockFeature, status: "shipped" as const };
    chain.returning.mockResolvedValue([updated]);
    const caller = createCaller({ userId: "user_abc", ip: "127.0.0.1" });

    const result = await caller.updateStatus({ id: FEATURE_ID, status: "shipped" });

    expect(mockDb.update).toHaveBeenCalled();
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "shipped" }),
    );
    expect(result).toEqual(updated);
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const caller = createCaller(ctx);

    await expect(
      caller.updateStatus({ id: FEATURE_ID, status: "shipped" }),
    ).rejects.toThrow(TRPCError);
  });
});

describe("feature.delete", () => {
  it("deletes a feature", async () => {
    chain.where.mockResolvedValue(undefined);
    const caller = createCaller({ userId: "user_abc", ip: "127.0.0.1" });

    const result = await caller.delete({ id: FEATURE_ID });

    expect(mockDb.delete).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const caller = createCaller(ctx);

    await expect(caller.delete({ id: FEATURE_ID })).rejects.toThrow(TRPCError);
  });
});
