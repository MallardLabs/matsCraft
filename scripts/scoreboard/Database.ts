import { world, ScoreboardObjective, ScoreboardIdentity, Entity, system, ScoreboardIdentityType } from "@minecraft/server";

export class Database<T = any> {
  private onSetCallback: Array<(data: { key: string; value: T }) => void> = [];
  private Database: Map<string, T>;

  constructor(name: string) {
    this.Database = new Map();

    const objectiveName = `Database:${name}`;
    let objective = world.scoreboard.getObjective(objectiveName);
    if (!objective) {
      objective = world.scoreboard.addObjective(objectiveName, objectiveName);
    }

    for (const participant of objective.getParticipants()) {
      if (participant.type === ScoreboardIdentityType.FakePlayer) {
        const [key, value] = participant.displayName.split("\n_`Split`_\n");
        try {
          this.Database.set(key, JSON.parse(value));
        } catch {
          this.Database.set(key, value as unknown as T);
        }
      }
    }
  }

  get length(): number {
    return this.Database.size;
  }

  get(key: string): T | undefined {
    return this.Database.get(key);
  }

  set(key: string, value: T): void {
    this.onSetCallback.forEach(callback => callback({ key, value }));
    const stringified = JSON.stringify(value);
    const participant = `${key}\n_Split_\n${stringified}`;
    const objective = world.scoreboard.getObjective(`Database:${key}`);
    if (objective) objective.setScore(participant, 0);
    this.Database.set(key, value);
  }

  has(key: string): boolean {
    return this.Database.has(key);
  }

  delete(key: string): boolean {
    const result = this.Database.delete(key);
    const objective = world.scoreboard.getObjective(`Database:${key}`);
    const participants = objective?.getParticipants();
    for (const p of participants ?? []) {
      if (p.displayName.startsWith(`${key}\n_`)) {
        objective?.removeParticipant(p);
      }
    }
    return result;
  }

  clear(): void {
    this.Database.clear();
  }

  keys(): IterableIterator<string> {
    return this.Database.keys();
  }

  values(): IterableIterator<T> {
    return this.Database.values();
  }

  entries(): IterableIterator<[string, T]> {
    return this.Database.entries();
  }

  forEach(callback: (key: string, value: T) => void): void {
    for (const [key, value] of this.Database.entries()) {
      callback(key, value);
    }
  }

  onSet = {
    subscribe: (callback: (data: { key: string; value: T }) => void) => {
      this.onSetCallback.push(callback);
      return { callback };
    },
    unsubscribe: (listener: { callback: (data: { key: string; value: T }) => void }) => {
      const index = this.onSetCallback.indexOf(listener.callback);
      if (index !== -1) {
        this.onSetCallback.splice(index, 1);
      }
    }
  };
}
