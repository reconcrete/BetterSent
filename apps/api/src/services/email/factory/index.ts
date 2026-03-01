import { Resend } from "resend";

import { EmailService } from "../implementation";

export function createEmailService(): EmailService {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    throw new Error("RESEND_FROM_EMAIL environment variable is not set");
  }

  return new EmailService(
    new Resend(process.env.RESEND_API_KEY),
    process.env.RESEND_FROM_EMAIL,
  );
}
