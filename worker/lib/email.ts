import nodemailer from 'nodemailer';
import ForgotPassword from '../email-templates/forgot-password';
import { VerifyEmailOTP } from '../email-templates/verify-email-otp';

const BLACKLIST_SOURCE =
  'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf';

const {
  SMTP_SERVER_NAME,
  SMTP_DOMAIN,
  SMTP_USERNAME,
  SMTP_PASSWORD,
  SMTP_PORT,
} = process.env;

let blocklist: { domains: Set<string>; fetchedAt: number } | undefined;
const BLOCKLIST_TTL_MS = 60 * 60 * 1000;

/**
 * The list is ~100 KB, so it is cached per isolate for an hour instead of
 * re-downloaded on every sign-up. If GitHub is unreachable, sign-up stays
 * available (fails open) rather than returning 500.
 */
export async function isEmailDomainDisposable(domain: string) {
  if (!blocklist || Date.now() - blocklist.fetchedAt > BLOCKLIST_TTL_MS) {
    try {
      const res = await fetch(BLACKLIST_SOURCE);
      if (!res.ok) throw new Error(`blocklist fetch ${res.status}`);
      const text = await res.text();
      blocklist = {
        domains: new Set(text.split('\n').map((d) => d.trim().toLowerCase())),
        fetchedAt: Date.now(),
      };
    } catch (e) {
      console.log('Disposable email blocklist unavailable', e);
      if (!blocklist) return false;
    }
  }
  return blocklist.domains.has(domain.toLowerCase());
}

function createTransport() {
  const transport = nodemailer.createTransport({
    host: SMTP_SERVER_NAME,
    // optional override, e.g. a local SMTP sink in .dev.vars
    port: Number(SMTP_PORT) || 587,
    auth: {
      user: SMTP_USERNAME,
      pass: SMTP_PASSWORD,
    },
  });
  return transport;
}

export async function sendVerificationEmail(email: string, otp: string) {
  const transport = createTransport();
  const mailOptions = {
    from: `"JustSendToMe" <noreply@${SMTP_DOMAIN}>`,
    to: email,
    subject: 'Verify your email address',
    html: VerifyEmailOTP({ otp }),
  };
  const info = await transport.sendMail(mailOptions);
  if (info.rejected.length > 0) throw Error(info.response);
}

export async function sendResetPasswordEmail(email: string, url: string) {
  const transport = createTransport();
  const mailOptions = {
    from: `"JustSendToMe" <noreply@${SMTP_DOMAIN}>`,
    to: email,
    subject: 'Reset your password',
    html: ForgotPassword({ url }),
  };
  const info = await transport.sendMail(mailOptions);
  if (info.rejected.length > 0) throw Error(info.response);
}

export async function sendEmail(email: string, subject: string, html: string) {
  const transport = createTransport();
  const mailOptions = {
    from: `"JustSendToMe" <noreply@${SMTP_DOMAIN}>`,
    to: email,
    subject,
    html,
  };
  const info = await transport.sendMail(mailOptions);
  if (info.rejected.length > 0) throw Error(info.response);
}
