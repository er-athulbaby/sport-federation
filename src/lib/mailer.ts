import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, text: string) {
  const t = getTransporter();
  if (!t) {
    console.warn(`SMTP not configured — skipping email to ${to}: ${subject}`);
    return;
  }
  await t.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
}
