import { type Attachment, Resend } from "resend";

export class EmailService {
  private static resendClient: Resend | null = null;

  private getClient(): Resend {
    if (!EmailService.resendClient) {
      if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY environment variable is not set");
      }

      if (!process.env.RESEND_FROM_EMAIL) {
        throw new Error("RESEND_FROM_EMAIL environment variable is not set");
      }

      EmailService.resendClient = new Resend(process.env.RESEND_API_KEY);
    }

    return EmailService.resendClient;
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
