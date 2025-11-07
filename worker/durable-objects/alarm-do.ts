import { Storage } from '@cloudflare/actors/storage';
import { Alarms } from '@cloudflare/actors/alarms';
import { DurableObject } from 'cloudflare:workers';

export abstract class AlarmDO extends DurableObject<Env> {
  storage: Storage;
  alarms: Alarms<this>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.storage = new Storage(ctx.storage);
    this.alarms = new Alarms(ctx, this);
  }

  async alarm() {
    await this.alarms.alarm();
  }
}
