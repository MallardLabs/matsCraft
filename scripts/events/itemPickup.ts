import { world, system, Player, ItemStack, Container } from "@minecraft/server";

type PickupData = {
  typeId: string;
  amount: number;
  player: Player;
};

type PickupActions = {
  remove(): void;
};

type PickupCallback = (data: PickupData, actions: PickupActions) => void;

type ListenerEntry = {
  callback: PickupCallback;
  tick: number;
  counter: number;
};

class ItemPickup {
  private readonly DEFAULT_TICK = 20;
  private listeners: ListenerEntry[] = [];
  private playerCache = new Map<string, Map<string, number>>();
  private systemIntervalId: number | null = null;
  private systemIntervalTick: number = this.DEFAULT_TICK;

  constructor() {
    this.startSystemInterval();
  }

  private startSystemInterval(): void {
    if (this.systemIntervalId !== null) return;

    this.systemIntervalId = system.runInterval(() => {
      const players = world.getPlayers();

      this.listeners.forEach((listener) => {
        listener.counter += this.systemIntervalTick;
      });

      for (const player of players) {
        if (!player.hasComponent("minecraft:inventory")) continue;

        const inventory = player.getComponent("minecraft:inventory")
          ?.container as Container;
        const current = this.snapshotInventory(inventory);
        const previous = this.playerCache.get(player.name) || new Map();

        for (const [typeId, amount] of current) {
          const oldAmount = previous.get(typeId) || 0;
          if (amount <= oldAmount) continue;

          const pickedUpAmount = amount - oldAmount;
          const data: PickupData = {
            typeId,
            amount: pickedUpAmount,
            player,
          };
          const actions: PickupActions = {
            remove: () => {
              try {
                this.removeItemsFromInventory(
                  typeId,
                  pickedUpAmount,
                  inventory
                );
              } catch (error: any) {
                console.error(`Failed to remove items: ${error.message}`);
              }
            },
          };

          this.listeners.forEach((listener) => {
            if (listener.counter >= listener.tick) {
              listener.callback(data, actions);
              listener.counter = 0;
            }
          });
        }

        this.playerCache.set(player.name, current);
      }
    }, this.systemIntervalTick);
  }

  private adjustSystemInterval(): void {
    const minTick = this.listeners.reduce(
      (min, listener) => Math.min(listener.tick, min),
      this.DEFAULT_TICK
    );

    if (minTick !== this.systemIntervalTick) {
      this.systemIntervalTick = minTick;
      if (this.systemIntervalId !== null) {
        system.clearRun(this.systemIntervalId);
        this.systemIntervalId = null;
        this.startSystemInterval();
      }
    }
  }

  private snapshotInventory(inventory: Container): Map<string, number> {
    const result = new Map<string, number>();
    for (let i = 0; i < inventory.size; i++) {
      const item = inventory.getItem(i);
      if (item) {
        result.set(item.typeId, (result.get(item.typeId) || 0) + item.amount);
      }
    }
    return result;
  }

  private removeItemsFromInventory(
    typeId: string,
    amountToRemove: number,
    inventory: Container
  ): void {
    let remaining = amountToRemove;
    for (let i = 0; i < inventory.size && remaining > 0; i++) {
      const item = inventory.getItem(i);
      if (item && item.typeId === typeId) {
        if (item.amount <= remaining) {
          inventory.setItem(i, undefined);
          remaining -= item.amount;
        } else {
          item.amount -= remaining;
          inventory.setItem(i, item);
          remaining = 0;
        }
      }
    }
  }

  /**
   * Register a callback for item pickup events.
   */
  public listen(callback: PickupCallback, tick = this.DEFAULT_TICK): void {
    if (typeof callback !== "function") {
      throw new Error("Callback must be a function");
    }
    if (!Number.isInteger(tick) || tick < 1) {
      throw new Error("Tick must be a positive integer");
    }

    this.listeners.push({ callback, tick, counter: 0 });
    this.adjustSystemInterval();
    this.startSystemInterval();
  }
}

const itemPickup = new ItemPickup();

export default itemPickup;
