import { Resend } from "resend";
import { PRODUCT_NAME } from "@/config/brand";

// Sign-in emails only. Nothing we send ever quotes a person's work, because we don't have it.
export async function sendSignInLink(to: string, link: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[dev] sign-in link for ${to}: ${link}`);
      return;
    }
    throw new Error("RESEND_API_KEY and EMAIL_FROM must be set in production");
  }
  await new Resend(key).emails.send({
    from,
    to,
    subject: `Your ${PRODUCT_NAME} sign-in link`,
    text: `Here's your sign-in link. It works once and expires in 15 minutes.\n\n${link}\n\nIf you didn't ask for it, ignore this email.`,
  });
}
