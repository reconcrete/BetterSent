import { Resend } from "resend";

import type { EmailAttachment } from "../types";

export class EmailService {
  constructor(
    private readonly client: Resend,
    private readonly fromEmail: string,
  ) {}

  async sendEmail(to: string | string[], subject: string, text: string, attachments: EmailAttachment[]): Promise<void> {
    await this.client.emails.send({
      from: this.fromEmail,
      to,
      subject,
      text,
      attachments,
    });
  }
}
