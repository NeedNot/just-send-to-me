import { env } from 'cloudflare:workers';
import ForgotPassword from '../email-templates/forgot-password';
import { VerifyEmailOTP } from '../email-templates/verify-email-otp';

const BLACKLIST_SOURCE =
  'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf';

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

/**
 * Sends through Cloudflare Email Sending (the EMAIL send_email binding).
 *
 * The sender domain must be onboarded under Email Service > Email Sending.
 * In local dev (`wrangler dev` / `vite dev`) the binding is simulated: the
 * message is printed to the console and saved to a local file, nothing is
 * delivered. send() rejects on failure, e.g. an unverified sender
 * (E_SENDER_NOT_VERIFIED) or a recipient the plan doesn't allow
 * (E_RECIPIENT_PLAN_RESTRICTED); callers decide whether that is fatal.
 */
async function send({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  try {
    await env.EMAIL.send({
      from: { email: env.EMAIL_FROM_ADDRESS, name: 'JustSendToMe' },
      to,
      subject,
      html,
      text,
    });
  } catch (e) {
    const code = (e as { code?: string }).code;
    console.log('Email send failed', code ?? '', subject, e);
    throw e;
  }
}

export async function sendVerificationEmail(email: string, otp: string) {
  await send({
    to: email,
    subject: 'Verify your email address',
    html: VerifyEmailOTP({ otp }),
    text: `Your JustSendToMe verification code is ${otp}.\n\nIf you didn't request this, you can ignore this email.`,
  });
}

export async function sendResetPasswordEmail(email: string, url: string) {
  await send({
    to: email,
    subject: 'Reset your password',
    html: ForgotPassword({ url }),
    text: `Reset your JustSendToMe password: ${url}\n\nIf you didn't request this, you can ignore this email.`,
  });
}

export async function sendEmail(
  email: string,
  subject: string,
  html: string,
  text: string,
) {
  await send({ to: email, subject, html, text });
}
