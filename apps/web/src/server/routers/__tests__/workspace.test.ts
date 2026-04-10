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
  workspaces: { id: "workspaces.id", slug: "workspaces.slug", name: "workspaces.name" },
  features: {},
  votes: {},
  changelogEntries: {},
}));

import { createCallerFactory } from "@/server/trpc";
import { workspaceRouter } from "../workspace";

const createCaller = createCallerFactory(workspaceRouter);

const mockWorkspace = {
  id: "ws-uuid-1",
  name: "My Workspace",
  slug: "my-workspace",
  ownerId: "user_abc",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
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

describe("workspace.create", () => {
  it("creates a workspace for an authenticated user", async () => {
    chain.returning.mockResolvedValue([mockWorkspace]);
    const caller = createCaller({ userId: "user_abc", ip: "127.0.0.1" });

    const result = await caller.create({ name: "My Workspace", slug: "my-workspace" });

    expect(mockDb.insert).toHaveBeenCalled();
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ name: "My Workspace", slug: "my-workspace", ownerId: "user_abc" }),
    );
    expect(result).toEqual(mockWorkspace);
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const caller = createCaller({ userId: null, ip: "127.0.0.1" });

    await expect(caller.create({ name: "Test", slug: "test" })).rejects.toThrow(TRPCError);
  });

  it("rejects an invalid slug format", async () => {
    const caller = createCaller({ userId: "user_abc", ip: "127.0.0.1" });

    await expect(caller.create({ name: "Test", slug: "My Invalid Slug!" })).rejects.toThrow();
  });
});

describe("workspace.getBySlug", () => {
  it("returns a workspace by slug", async () => {
    chain.limit.mockResolvedValue([mockWorkspace]);
    const caller = createCaller({ userId: null, ip: "127.0.0.1" });

    const result = await caller.getBySlug({ slug: "my-workspace" });

    expect(result).toEqual(mockWorkspace);
  });

  it("returns null when workspace is not found", async () => {
    chain.limit.mockResolvedValue([]);
    const caller = createCaller({ userId: null, ip: "127.0.0.1" });

    const result = await caller.getBySlug({ slug: "nonexistent" });

    expect(result).toBeNull();
  });
});
