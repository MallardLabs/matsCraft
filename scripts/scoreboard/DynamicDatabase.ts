import { world } from "@minecraft/server";

export default class DynamicDatabase<T = any> {
  private Database: Map<string, T>;
  private DatabaseName: string;

  constructor(name: string) {
    this.Database = new Map();
    this.DatabaseName = `Database${name}`;

    const dynamicDatas = world.getDynamicPropertyIds().filter(id => id.startsWith(`${this.DatabaseName}|`));
    for (const dataId of dynamicDatas) {
      const key = dataId.split("|")[1];
      const rawValue = world.getDynamicProperty(dataId);
      let value: T | string | null = rawValue === undefined ? null : rawValue as string;
      try {
        value = JSON.parse(value as string);
      } catch (e) {}
      this.Database.set(key, value as T);
    }
    console.warn(`[Database] Loaded ${name}.`);
  }

  get length(): number {
    return this.Database.size;
  }

  get(key: string): T | undefined {
    return this.Database.get(key);
  }

  set(key: string, value: T): void {
    let newValue = typeof value === "object" ? JSON.stringify(value) : String(value);
    world.setDynamicProperty(`${this.DatabaseName}|${key}`, newValue);
    this.Database.set(key, value);
  }

  has(key: string): boolean {
    return this.Database.has(key);
  }

  delete(key: string): boolean {
    world.setDynamicProperty(`${this.DatabaseName}|${key}`);
    return this.Database.delete(key);
  }

  clear(): void {
    const dynamicDatas = world.getDynamicPropertyIds().filter(id => id.startsWith(`${this.DatabaseName}|`));
    dynamicDatas.forEach(id => world.setDynamicProperty(id));
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
}