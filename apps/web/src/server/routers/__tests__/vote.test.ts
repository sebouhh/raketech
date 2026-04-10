// @vitest-environment node
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

  const mockRedis = {
    exists: vi.fn(),
    set: vi.fn(),
  };

  return { mockDb, chain, mockRedis };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: null }),
}));

vi.mock("@/server/redis", () => ({ redis: mockRedis }));

vi.mock("@raketech/db", () => ({
  db: mockDb,
  workspaces: {},
  features: {},
  votes: { featureId: "votes.featureId" },
  changelogEntries: {},
}));

import { createCallerFactory } from "@/server/trpc";
import { voteRouter } from "../vote";

const createCaller = createCallerFactory(voteRouter);

const FEATURE_ID = "00000000-0000-0000-0000-000000000001";
const TEST_IP = "192.168.1.1";

const mockVote = {
  id: "vote-uuid-1",
  featureId: FEATURE_ID,
  ip: TEST_IP,
  email: null,
  createdAt: new Date("2026-01-01"),
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

describe("vote.cast", () => {
  it("casts a vote when IP has not voted yet", async () => {
    mockRedis.exists.mockResolvedValue(0);
    mockRedis.set.mockResolvedValue("OK");
    chain.returning.mockResolvedValue([mockVote]);
    const caller = createCaller({ userId: null, ip: TEST_IP });

    const result = await caller.cast({ featureId: FEATURE_ID });

    expect(mockRedis.exists).toHaveBeenCalledWith(`vote:${FEATURE_ID}:${TEST_IP}`);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockRedis.set).toHaveBeenCalledWith(
      `vote:${FEATURE_ID}:${TEST_IP}`,
      "1",
      { ex: expect.any(Number) },
    );
    expect(result).toEqual({ success: true, alreadyVoted: false, vote: mockVote });
  });

  it("rejects duplicate votes from the same IP", async () => {
    mockRedis.exists.mockResolvedValue(1);
    const caller = createCaller({ userId: null, ip: TEST_IP });

    const result = await caller.cast({ featureId: FEATURE_ID });

    expect(result).toEqual({ success: false, alreadyVoted: true });
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it("stores optional email when provided", async () => {
    mockRedis.exists.mockResolvedValue(0);
    mockRedis.set.mockResolvedValue("OK");
    const voteWithEmail = { ...mockVote, email: "user@example.com" };
    chain.returning.mockResolvedValue([voteWithEmail]);
    const caller = createCaller({ userId: null, ip: TEST_IP });

    const result = await caller.cast({
      featureId: FEATURE_ID,
      email: "user@example.com",
    });

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ email: "user@example.com" }),
    );
    expect(result).toEqual({ success: true, alreadyVoted: false, vote: voteWithEmail });
  });
});

describe("vote.count", () => {
  it("returns the vote count for a feature", async () => {
    chain.where.mockResolvedValue([{ count: 42 }]);
    const caller = createCaller({ userId: null, ip: "127.0.0.1" });

    const result = await caller.count({ featureId: FEATURE_ID });

    expect(result).toEqual({ count: 42 });
  });

  it("returns 0 when there are no votes", async () => {
    chain.where.mockResolvedValue([{ count: 0 }]);
    const caller = createCaller({ userId: null, ip: "127.0.0.1" });

    const result = await caller.count({ featureId: FEATURE_ID });

    expect(result).toEqual({ count: 0 });
  });
});
