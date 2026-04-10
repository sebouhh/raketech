import { Resend } from "resend";

let _resend: Resend | undefined;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@raketech.app";

export async function sendShipNotification({
  featureTitle,
  workspaceSlug,
  recipientEmail,
}: {
  featureTitle: string;
  workspaceSlug: string;
  recipientEmail: string;
}): Promise<void> {
  try {
    await getResend().emails.send({
      from: FROM,
      to: recipientEmail,
      subject: `"${featureTitle}" just shipped!`,
      html: `<p>Great news! The feature you voted for — <strong>${featureTitle}</strong> — has just shipped.</p>
             <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://raketech.app"}/${workspaceSlug}/changelog">View the changelog</a></p>`,
    });
  } catch (err) {
    console.error("[email] Failed to send ship notification to", recipientEmail, err);
  }
}

export async function sendDailyDigest({
  recipientEmail,
  features,
}: {
  recipientEmail: string;
  features: Array<{ title: string; newVoteCount: number }>;
}): Promise<void> {
  try {
    const featureRows = features
      .map(
        (f) =>
          `<li><strong>${f.title}</strong> — ${f.newVoteCount} new vote${f.newVoteCount !== 1 ? "s" : ""}</li>`,
      )
      .join("");

    await getResend().emails.send({
      from: FROM,
      to: recipientEmail,
      subject: "Your daily roadmap vote digest",
      html: `<h2>Daily Vote Digest</h2>
             <p>Here's what your users have been voting for in the past 24 hours:</p>
             <ul>${featureRows}</ul>`,
    });
  } catch (err) {
    console.error("[email] Failed to send daily digest to", recipientEmail, err);
  }
}
