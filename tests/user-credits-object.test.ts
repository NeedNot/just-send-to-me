import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { inDurableObject } from './helpers';
import type { UserCreditsObject } from '../worker/durable-objects/user-credits-object';
import { MS_IN_DAY } from '../shared/constants';

describe('UserCreditsObject', () => {
  it('spends regular credits before gifted ones', async () => {
    const stub = env.USER_CREDITS_OBJECT.getByName('spend-order');
    await stub.updateMaxCredits(3);
    await stub.giftCredits(2);
    await stub.spendCredits(4);
    expect(await stub.getRemainingCredits()).toBe(1);
    // call the instance directly: a rejected DO RPC call is reported as an
    // unhandled rejection by the test pool even when the test awaits it
    await inDurableObject(stub, async (instance: UserCreditsObject) => {
      await expect(instance.spendCredits(2)).rejects.toThrow(
        'Not enough credits',
      );
    });
  });

  it('refunds credits once a transaction is 30 days old', async () => {
    const stub = env.USER_CREDITS_OBJECT.getByName('refund');
    await stub.updateMaxCredits(3);
    await stub.spendCredits(2);
    expect(await stub.getRemainingCredits()).toBe(1);

    await inDurableObject(stub, async (instance: UserCreditsObject, state) => {
      state.storage.sql.exec(
        'UPDATE outstanding_transactions SET created_at = ?',
        Date.now() - 31 * MS_IN_DAY,
      );
      await instance.handleAlarm();
    });

    expect(await stub.getRemainingCredits()).toBe(3);
  });

  it('does not refund transactions younger than 30 days', async () => {
    const stub = env.USER_CREDITS_OBJECT.getByName('no-early-refund');
    await stub.updateMaxCredits(3);
    await stub.spendCredits(1);
    await inDurableObject(stub, (instance: UserCreditsObject) =>
      instance.handleAlarm(),
    );
    expect(await stub.getRemainingCredits()).toBe(2);
  });

  it('raises the allowance when the plan is upgraded', async () => {
    const stub = env.USER_CREDITS_OBJECT.getByName('upgrade');
    await stub.updateMaxCredits(3);
    await stub.spendCredits(2);
    await stub.updateMaxCredits(10);
    expect(await stub.getRemainingCredits()).toBe(8);
  });
});

describe('UserCreditsObject refunds', () => {
  it('refundTransaction gives back exactly what a spend took', async () => {
    const stub = env.USER_CREDITS_OBJECT.getByName('refund-tx');
    await stub.updateMaxCredits(3);
    await stub.giftCredits(1);
    const id = await stub.spendCredits(4);
    expect(await stub.getRemainingCredits()).toBe(0);
    await stub.refundTransaction(id);
    expect(await stub.getRemainingCredits()).toBe(4);
    // refunding twice is a no-op
    await stub.refundTransaction(id);
    expect(await stub.getRemainingCredits()).toBe(4);
  });
});
