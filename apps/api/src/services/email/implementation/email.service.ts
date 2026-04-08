import { Resend } from "resend";

import type { EmailAttachment } from "../types";

export class EmailService {
  private readonly client: Resend;
  private readonly fromEmail: string;

  constructor(client: Resend, fromEmail: string) {
    this.client = client;
    this.fromEmail = fromEmail;
  }

  async sendEmail(to: string | string[], subject: string, text: string, attachments: EmailAttachment[]): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.fromEmail,
      to,
      subject,
      text,
      attachments,
    });

    if (error) {
      throw new Error(`Email send failed: ${error.message}`);
    }
  }
}
