import { type Attachment, Resend } from "resend";

export class EmailService {
  private static resend: Resend | null = null;

  private getClient(): Resend {
    if (!EmailService.resend) {
      if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY environment variable is not set");
      }

      if (!process.env.RESEND_FROM_EMAIL) {
        throw new Error("RESEND_FROM_EMAIL environment variable is not set");
      }

      EmailService.resend = new Resend(process.env.RESEND_API_KEY);
    }

    return EmailService.resend;
  }

  public async sendEmail(to: Array<string> | string, subject: string, text: string, attachments: Array<Attachment>) {
    return await this.getClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL as string,
      to,
      subject,
      text,
      attachments,
    });
  }
}
