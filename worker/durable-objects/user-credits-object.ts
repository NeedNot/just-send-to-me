import { MS_IN_DAY } from '../../shared/constants';
import { AlarmDO } from './alarm-do';

type OutstandingTransaction = {
  id: number,
  gifted_credits: number,
  credits: number,
  created_at: number
}

export class UserCreditsObject extends AlarmDO {
  remainingCredits: number = 0;
  remainingGiftedCredits: number = 0;
  sql: SqlStorage;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.ctx.blockConcurrencyWhile(async () => {
      this.sql.exec(`CREATE TABLE IF NOT EXISTS outstanding_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          gifted_credits INTEGER NOT NULL,
          credits INTEGER NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
        )`)
      this.remainingCredits =
        (await this.ctx.storage.get('remainingCredits')) || 0;
      this.remainingGiftedCredits = (await this.ctx.storage.get('remainingGiftedCredits')) || 0;
    });
  }

  async alarm(alarmInfo?: AlarmInvocationInfo) {
    await this.alarms.alarm(alarmInfo);
  }

  // reemburses credits
  async handleAlarm() {
    const rows = this.sql.exec<OutstandingTransaction>('DROP FROM outstanding_transactions WHERE created_at <= ? RETURNING *', Date.now() - (MS_IN_DAY * 30)).toArray()
    const refund = rows.reduce((prev, r) => prev + r.credits, 0)
    this.remainingCredits += refund;
    await this.ctx.storage.put('remainingCredits', this.remainingCredits);
    console.log('Adding back credits', refund);
  }

  async updateMaxCredits(credits: number) {
    const rows = this.sql.exec<{ credits: number }>('SELECT credits FROM outstanding_transactions').toArray()
    const spent = rows.reduce((prev, r) => prev + r.credits, 0)
    this.remainingCredits = credits - spent;
    await this.ctx.storage.put('remainingCredits', this.remainingCredits);
  }

  async spendCredits(credits: number) {
    if ((this.remainingCredits + this.remainingGiftedCredits) - credits < 0) throw Error("Not enough credits");
    const regularSpent = this.remainingCredits >= credits ? credits : this.remainingCredits;
    const giftedSpent = credits - regularSpent;
    this.remainingCredits -= regularSpent
    this.remainingGiftedCredits -= giftedSpent
    await Promise.all([this.ctx.storage.put('remainingCredits', this.remainingCredits),
    this.ctx.storage.put('remainingGiftedCredits', this.remainingGiftedCredits)]);

    this.sql.exec('INSERT INTO outstanding_transactions (gifted_credits, credits) VALUES (?, ?)', giftedSpent, regularSpent)
    // wait 30d
    this.alarms.schedule(30 * 24 * 60 * 60, 'handleAlarm');
  }

  async hasEnoughCredits(credits: number) {
    return (this.remainingCredits + this.remainingGiftedCredits) - credits >= 0;
  }

  async giftCredits(credits: number) {
    this.remainingGiftedCredits += credits
    await this.ctx.storage.put('remainingGiftedCredits', this.remainingGiftedCredits);
  }

  async getRemainingCredits() {
    return (this.remainingCredits + this.remainingGiftedCredits);
  }

  async deleteStorage() {
    this.ctx.storage.deleteAll();
  }
}
