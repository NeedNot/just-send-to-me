import nodemailer from 'nodemailer';

const BLACKLIST_SOURCE =
  'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf';

export async function isEmailDomainDisposable(domain: string) {
  const list = await fetch(BLACKLIST_SOURCE)
    .then((res) => res.text())
    .then((res) => res.split('\n'));

  return list.includes(domain.toLowerCase());
}

const { SMTP_SERVER_NAME, SMTP_DOMAIN, SMTP_USERNAME, SMTP_PASSWORD } =
  process.env;

const transport = nodemailer.createTransport({
  host: SMTP_SERVER_NAME,
  port: 587,
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, otp: string) {
  const mailOptions = {
    from: `"Just send to me" <noreply@${SMTP_DOMAIN}>`,
    to: email,
    subject: 'Verify your email address',
    html: 'Please verify ' + otp,
  };

  const info = await transport.sendMail(mailOptions);
  if (info.rejected.length > 0) throw Error(info.response);
}
