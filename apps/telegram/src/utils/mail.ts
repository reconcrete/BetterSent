import { RESEND_API_KEY, RESEND_FROM_EMAIL } from "../config";

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationCode(to: string, code: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to,
        subject: "Your Bettersent verification code",
        text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
