// @vitest-environment node
import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDb, chain, mockRedis } = vi.hoisted(() => {
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

  const mockRedis = { lpush: vi.fn(), rpop: vi.fn() };

  return { mockDb, chain, mockRedis };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: null }),
}));

vi.mock("@/server/redis", () => ({ redis: mockRedis }));

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
const CTX = { userId: null, ip: "0.0.0.0" } as const;

const mockFeature = {
  id: FEATURE_ID,
  workspaceId: WORKSPACE_ID,
  title: "Dark mode",
  description: "Add dark mode support",
  status: "planned" as const,
  internalNotes: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

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
  mockRedis.lpush.mockResolvedValue(1);
});

describe("feature.list", () => {
  it("lists features for a workspace with vote counts", async () => {
    const featureWithCount = { ...mockFeature, voteCount: 5 };
    chain.orderBy.mockResolvedValue([featureWithCount]);
    const caller = createCaller(CTX);

    const result = await caller.list({ workspaceId: WORKSPACE_ID });

    expect(mockDb.select).toHaveBeenCalled();
    expect(result).toEqual([featureWithCount]);
  });

  it("returns empty array when no features exist", async () => {
    chain.orderBy.mockResolvedValue([]);
    const caller = createCaller(CTX);

    const result = await caller.list({ workspaceId: WORKSPACE_ID });

    expect(result).toEqual([]);
  });
});

describe("feature.create", () => {
  it("creates a feature with planned status by default", async () => {
    chain.returning.mockResolvedValue([mockFeature]);
    const caller = createCaller({ userId: "user_abc", ip: "0.0.0.0" });

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
    const caller = createCaller(CTX);

    await expect(
      caller.create({ workspaceId: WORKSPACE_ID, title: "Dark mode" }),
    ).rejects.toThrow(TRPCError);
  });
});

describe("feature.updateStatus", () => {
  it("updates a feature status", async () => {
    const updated = { ...mockFeature, status: "shipped" as const };
    chain.returning.mockResolvedValue([updated]);
    const caller = createCaller({ userId: "user_abc", ip: "0.0.0.0" });

    const result = await caller.updateStatus({ id: FEATURE_ID, status: "shipped" });

    expect(mockDb.update).toHaveBeenCalled();
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "shipped" }),
    );
    expect(result).toEqual(updated);
  });

  it("enqueues a ship-notify job in Redis when status becomes shipped", async () => {
    const updated = { ...mockFeature, status: "shipped" as const };
    chain.returning.mockResolvedValue([updated]);
    const caller = createCaller({ userId: "user_abc", ip: "0.0.0.0" });

    await caller.updateStatus({ id: FEATURE_ID, status: "shipped" });

    expect(mockRedis.lpush).toHaveBeenCalledWith(
      "queue:ship-notify",
      expect.stringContaining(FEATURE_ID),
    );
    const queuePayload = JSON.parse(mockRedis.lpush.mock.calls[0][1]);
    expect(queuePayload).toMatchObject({
      featureId: FEATURE_ID,
      featureTitle: mockFeature.title,
      workspaceId: WORKSPACE_ID,
    });
  });

  it("does not enqueue a Redis job for non-shipped statuses", async () => {
    const updated = { ...mockFeature, status: "in_progress" as const };
    chain.returning.mockResolvedValue([updated]);
    const caller = createCaller({ userId: "user_abc", ip: "0.0.0.0" });

    await caller.updateStatus({ id: FEATURE_ID, status: "in_progress" });

    expect(mockRedis.lpush).not.toHaveBeenCalled();
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const caller = createCaller(CTX);

    await expect(
      caller.updateStatus({ id: FEATURE_ID, status: "shipped" }),
    ).rejects.toThrow(TRPCError);
  });
});

describe("feature.delete", () => {
  it("deletes a feature", async () => {
    chain.where.mockResolvedValue(undefined);
    const caller = createCaller({ userId: "user_abc", ip: "0.0.0.0" });

    const result = await caller.delete({ id: FEATURE_ID });

    expect(mockDb.delete).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const caller = createCaller(CTX);

    await expect(caller.delete({ id: FEATURE_ID })).rejects.toThrow(TRPCError);
  });
});
