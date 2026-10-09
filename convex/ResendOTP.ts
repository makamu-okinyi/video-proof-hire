import { Email } from "@convex-dev/auth/providers/Email";

/**
 * Password-reset codes, emailed through Resend. Needs two Convex env vars:
 *   RESEND_API_KEY   the Resend API key
 *   AUTH_EMAIL_FROM  a sender on a domain verified in Resend, e.g. "Donjo <no-reply@donjoafrica.com>"
 */
export const ResendOTP = Email({
  id: "resend-otp",
  maxAge: 15 * 60,
  async generateVerificationToken() {
    const bytes = new Uint32Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => String(b % 10)).join("");
  },
  async sendVerificationRequest({ identifier: email, token }) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.AUTH_EMAIL_FROM;
    if (!apiKey || !from) {
      console.error("RESEND_API_KEY / AUTH_EMAIL_FROM are not set; password reset emails cannot be sent.");
      throw new Error("EMAIL_NOT_CONFIGURED");
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Your Donjo password reset code",
        text: `Your Donjo password reset code is ${token}.\n\nIt expires in 15 minutes. If you did not ask to reset your password, you can ignore this email.`,
      }),
    });
    if (!res.ok) {
      console.error("Resend rejected the reset email", res.status, await res.text());
      throw new Error("EMAIL_SEND_FAILED");
    }
  },
});
