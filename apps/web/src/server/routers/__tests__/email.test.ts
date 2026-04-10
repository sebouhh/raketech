// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

import { sendDailyDigest, sendShipNotification } from "@/server/email";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sendShipNotification", () => {
  it("sends an email with the feature title in the subject", async () => {
    mockSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

    await sendShipNotification({
      featureTitle: "Dark mode",
      workspaceSlug: "acme",
      recipientEmail: "voter@example.com",
    });

    expect(mockSend).toHaveBeenCalledOnce();
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "voter@example.com",
        subject: expect.stringContaining("Dark mode"),
        html: expect.stringContaining("Dark mode"),
      }),
    );
  });

  it("includes a changelog link with the workspace slug", async () => {
    mockSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

    await sendShipNotification({
      featureTitle: "Export CSV",
      workspaceSlug: "my-workspace",
      recipientEmail: "user@example.com",
    });

    const [call] = mockSend.mock.calls;
    expect(call[0].html).toContain("my-workspace");
  });

  it("does not throw when Resend API errors", async () => {
    mockSend.mockRejectedValue(new Error("Resend API error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      sendShipNotification({
        featureTitle: "Dark mode",
        workspaceSlug: "acme",
        recipientEmail: "voter@example.com",
      }),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("sendDailyDigest", () => {
  it("sends a digest listing all features and their vote counts", async () => {
    mockSend.mockResolvedValue({ data: { id: "email-2" }, error: null });

    await sendDailyDigest({
      recipientEmail: "owner@example.com",
      features: [
        { title: "Dark mode", newVoteCount: 12 },
        { title: "Export CSV", newVoteCount: 1 },
      ],
    });

    expect(mockSend).toHaveBeenCalledOnce();
    const [call] = mockSend.mock.calls;
    expect(call[0].to).toBe("owner@example.com");
    expect(call[0].html).toContain("Dark mode");
    expect(call[0].html).toContain("12 new votes");
    expect(call[0].html).toContain("Export CSV");
    expect(call[0].html).toContain("1 new vote");
    // singular form
    expect(call[0].html).not.toContain("1 new votes");
  });

  it("does not throw when Resend API errors", async () => {
    mockSend.mockRejectedValue(new Error("Network failure"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      sendDailyDigest({
        recipientEmail: "owner@example.com",
        features: [{ title: "Feature X", newVoteCount: 5 }],
      }),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
