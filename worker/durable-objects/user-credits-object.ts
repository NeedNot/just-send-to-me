import { DurableObject } from 'cloudflare:workers';

export class UserCreditsObject extends DurableObject<Env> {
  remainingCredits: number = 0;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      this.remainingCredits =
        (await this.ctx.storage.get('remainingCredits')) || 0;
    });
  }

  async updateRemainingCredits(credits: number) {
    console.log("updating remaining credits", credits)
    this.remainingCredits = credits;
    await this.ctx.storage.put('remainingCredits', credits);
  }

  async spendCredits(credits: number) {
    this.remainingCredits -= credits;
    await this.ctx.storage.put('remainingCredits', this.remainingCredits)
  }

  async hasEnoughCredits(credits: number) {
    return this.remainingCredits - credits >= 0;
  }

  async addCredits(credits: number) {
    this.remainingCredits += credits;
    await this.ctx.storage.put('remainingCredits', this.remainingCredits);
  }

  async getRemainingCredits() {
    return this.remainingCredits
  }

  async deleteStorage() {
    this.ctx.storage.deleteAll()
  } 
}
