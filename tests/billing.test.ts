import { env, SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import type StripeTypes from 'stripe';
import { user } from '../worker/db/auth-schema';
import { subscriptions } from '../worker/db/schema';
import { syncSubscription } from '../worker/lib/billing';
import { db, seedUser } from './helpers';

function fakeSubscription({
  id,
  customer,
  status,
  price = 'price_plus_month',
  userId,
}: {
  id: string;
  customer: string;
  status: StripeTypes.Subscription.Status;
  price?: string;
  userId?: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    id,
    customer,
    status,
    created: now,
    metadata: userId ? { userId } : {},
    items: {
      data: [
        {
          price: { id: price },
          current_period_start: now,
          current_period_end: now + 30 * 86400,
        },
      ],
    },
  } as unknown as StripeTypes.Subscription;
}

async function state(userId: string) {
  const u = await db().select().from(user).where(eq(user.id, userId)).get();
  const rows = await db()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));
  const credits =
    await env.USER_CREDITS_OBJECT.getByName(userId).getRemainingCredits();
  return { plan: u?.plan_id, rows, credits };
}

describe('syncSubscription', () => {
  it('grants the plan on an active subscription and revokes it on cancel', async () => {
    const userId = await seedUser();
    const cus = `cus_${userId}`;
    await syncSubscription(
      db(),
      env,
      fakeSubscription({
        id: `sub_a_${userId}`,
        customer: cus,
        status: 'active',
        userId,
      }),
    );
    expect(await state(userId)).toMatchObject({ plan: 'PLUS', credits: 10 });

    const res = await syncSubscription(
      db(),
      env,
      fakeSubscription({
        id: `sub_a_${userId}`,
        customer: cus,
        status: 'canceled',
      }),
    );
    expect(res).toMatchObject({ status: 'synced', planId: 'FREE' });
    const s = await state(userId);
    expect(s).toMatchObject({ plan: 'FREE', credits: 3 });
    expect(s.rows[0].status).toBe('inactive');
  });

  it('lets a returning customer resubscribe (one row per customer)', async () => {
    const userId = await seedUser();
    const cus = `cus_${userId}`;
    await syncSubscription(
      db(),
      env,
      fakeSubscription({
        id: `sub_old_${userId}`,
        customer: cus,
        status: 'canceled',
        userId,
      }),
    );
    await syncSubscription(
      db(),
      env,
      fakeSubscription({
        id: `sub_new_${userId}`,
        customer: cus,
        status: 'active',
        userId,
      }),
    );
    const s = await state(userId);
    expect(s.plan).toBe('PLUS');
    expect(s.rows).toHaveLength(1);
    expect(s.rows[0].id).toBe(`sub_new_${userId}`);
  });

  it('ignores a late cancellation of a previous subscription', async () => {
    const userId = await seedUser();
    const cus = `cus_${userId}`;
    await syncSubscription(
      db(),
      env,
      fakeSubscription({
        id: `sub_new_${userId}`,
        customer: cus,
        status: 'active',
        userId,
      }),
    );
    const res = await syncSubscription(
      db(),
      env,
      fakeSubscription({
        id: `sub_old_${userId}`,
        customer: cus,
        status: 'canceled',
      }),
    );
    expect(res.status).toBe('ignored');
    expect((await state(userId)).plan).toBe('PLUS');
  });

  it('is idempotent', async () => {
    const userId = await seedUser();
    const sub = fakeSubscription({
      id: `sub_x_${userId}`,
      customer: `cus_${userId}`,
      status: 'active',
      userId,
    });
    await syncSubscription(db(), env, sub);
    await syncSubscription(db(), env, sub);
    const s = await state(userId);
    expect(s.rows).toHaveLength(1);
    expect(s.credits).toBe(10);
  });

  it('throws on an unknown price so the webhook returns 5xx and Stripe retries', async () => {
    const userId = await seedUser();
    await expect(
      syncSubscription(
        db(),
        env,
        fakeSubscription({
          id: `sub_y_${userId}`,
          customer: `cus_${userId}`,
          status: 'active',
          price: 'price_unknown',
          userId,
        }),
      ),
    ).rejects.toThrow('No plan with priceId price_unknown');
  });
});

describe('POST /api/billing/webhook', () => {
  const payload = JSON.stringify({
    id: 'evt_test',
    object: 'event',
    type: 'invoice.paid',
    data: { object: { id: 'in_test', object: 'invoice' } },
  });
  const send = (body: string, signature?: string) =>
    SELF.fetch('http://localhost/api/billing/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json; charset=utf-8',
        ...(signature ? { 'stripe-signature': signature } : {}),
      },
      body,
    });
  // Stripe's signature scheme (t=<ts>,v1=HMAC-SHA256(secret, "<ts>.<body>")),
  // computed with WebCrypto: stripe-node's helper needs sync crypto
  const sign = async (body: string, secret = env.STRIPE_WEBHOOK_SECRET) => {
    const t = Math.floor(Date.now() / 1000);
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const mac = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${t}.${body}`),
    );
    const hex = [...new Uint8Array(mac)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `t=${t},v1=${hex}`;
  };

  it('accepts a correctly signed event (raw body)', async () => {
    expect((await send(payload, await sign(payload))).status).toBe(200);
  });

  it('rejects missing, wrong-secret and tampered signatures', async () => {
    expect((await send(payload)).status).toBe(400);
    expect(
      (await send(payload, await sign(payload, 'whsec_other'))).status,
    ).toBe(400);
    const tampered = payload.replace('in_test', 'in_evil');
    expect((await send(tampered, await sign(payload))).status).toBe(400);
  });
});
