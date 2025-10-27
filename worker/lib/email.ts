import nodemailer from 'nodemailer';
import ForgotPassword from '../email-templates/forgot-password';

const BLACKLIST_SOURCE =
  'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf';

const { SMTP_SERVER_NAME, SMTP_DOMAIN, SMTP_USERNAME, SMTP_PASSWORD } =
  process.env;

export async function isEmailDomainDisposable(domain: string) {
  const list = await fetch(BLACKLIST_SOURCE)
    .then((res) => res.text())
    .then((res) => res.split('\n'));

  return list.includes(domain.toLowerCase());
}

function createTransport() {
  const transport = nodemailer.createTransport({
    host: SMTP_SERVER_NAME,
    port: 587,
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
    from: `"Just send to me" <noreply@${SMTP_DOMAIN}>`,
    to: email,
    subject: 'Verify your email address',
    html: 'Please verify ' + otp,
  };
  const info = await transport.sendMail(mailOptions);
  if (info.rejected.length > 0) throw Error(info.response);
}

export async function sendResetPasswordEmail(email: string, url: string) {
  const transport = createTransport();
  const mailOptions = {
    from: `"Just send to me" <noreply@${SMTP_DOMAIN}>`,
    to: email,
    subject: 'Reset your password',
    html: ForgotPassword({url}),
  };
  const info = await transport.sendMail(mailOptions);
  if (info.rejected.length > 0) throw Error(info.response);
}