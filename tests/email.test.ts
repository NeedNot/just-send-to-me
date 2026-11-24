import { env } from 'cloudflare:test';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from '../worker/lib/email';

describe('email (Cloudflare Email Sending binding)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sends the OTP from noreply with HTML and a plain-text part', async () => {
    const send = vi
      .spyOn(env.EMAIL, 'send')
      .mockResolvedValue({ messageId: 'test' });
    await sendVerificationEmail('user@example.com', '123456');
    expect(send).toHaveBeenCalledOnce();
    const msg = send.mock.calls[0][0] as EmailMessageBuilder;
    expect(msg.from).toEqual({
      email: 'noreply@justsendto.me',
      name: 'JustSendToMe',
    });
    expect(msg.to).toBe('user@example.com');
    expect(msg.html).toContain('123456');
    expect(msg.text).toContain('123456');
  });

  it('includes the reset link in both parts', async () => {
    const send = vi
      .spyOn(env.EMAIL, 'send')
      .mockResolvedValue({ messageId: 'test' });
    await sendResetPasswordEmail('user@example.com', 'https://x.test/reset');
    const msg = send.mock.calls[0][0] as EmailMessageBuilder;
    expect(msg.html).toContain('https://x.test/reset');
    expect(msg.text).toContain('https://x.test/reset');
  });

  it('surfaces binding errors to the caller', async () => {
    const err = Object.assign(new Error('sender not verified'), {
      code: 'E_SENDER_NOT_VERIFIED',
    });
    vi.spyOn(env.EMAIL, 'send').mockRejectedValue(err);
    await expect(
      sendEmail('user@example.com', 'subject', '<p>hi</p>', 'hi'),
    ).rejects.toBe(err);
  });

  it('works against the local simulated binding', async () => {
    await expect(
      sendEmail('user@example.com', 'Local test', '<p>hi</p>', 'hi'),
    ).resolves.toBeUndefined();
  });
});
