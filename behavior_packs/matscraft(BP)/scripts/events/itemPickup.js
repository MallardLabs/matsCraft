import { world, system, } from "@minecraft/server";
class ItemPickup {
    constructor() {
        this.DEFAULT_TICK = 10;
        this.listeners = [];
        this.playerCache = new Map();
        this.systemIntervalId = null;
        this.systemIntervalTick = this.DEFAULT_TICK;
        this.startSystemInterval();
    }
    startSystemInterval() {
        if (this.systemIntervalId !== null)
            return;
        this.systemIntervalId = system.runInterval(() => {
            const players = world.getPlayers();
            this.listeners.forEach((listener) => {
                listener.counter += this.systemIntervalTick;
            });
            for (const player of players) {
                if (!player.hasComponent("minecraft:inventory"))
                    continue;
                const inventory = player.getComponent("minecraft:inventory")
                    ?.container;
                const current = this.snapshotInventory(inventory);
                const previous = this.playerCache.get(player.name) || new Map();
                for (const [typeId, amount] of current) {
                    const oldAmount = previous.get(typeId) || 0;
                    if (amount <= oldAmount)
                        continue;
                    const pickedUpAmount = amount - oldAmount;
                    const data = {
                        typeId,
                        amount: pickedUpAmount,
                        player,
                    };
                    const actions = {
                        remove: () => {
                            try {
                                this.removeItemsFromInventory(typeId, pickedUpAmount, inventory);
                            }
                            catch (error) {
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
    adjustSystemInterval() {
        const minTick = this.listeners.reduce((min, listener) => Math.min(listener.tick, min), this.DEFAULT_TICK);
        if (minTick !== this.systemIntervalTick) {
            this.systemIntervalTick = minTick;
            if (this.systemIntervalId !== null) {
                system.clearRun(this.systemIntervalId);
                this.systemIntervalId = null;
                this.startSystemInterval();
            }
        }
    }
    snapshotInventory(inventory) {
        const result = new Map();
        for (let i = 0; i < inventory.size; i++) {
            const item = inventory.getItem(i);
            if (item) {
                result.set(item.typeId, (result.get(item.typeId) || 0) + item.amount);
            }
        }
        return result;
    }
    removeItemsFromInventory(typeId, amountToRemove, inventory) {
        let remaining = amountToRemove;
        for (let i = 0; i < inventory.size && remaining > 0; i++) {
            const item = inventory.getItem(i);
            if (item && item.typeId === typeId) {
                if (item.amount <= remaining) {
                    inventory.setItem(i, undefined);
                    remaining -= item.amount;
                }
                else {
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
    listen(callback, tick = this.DEFAULT_TICK) {
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
