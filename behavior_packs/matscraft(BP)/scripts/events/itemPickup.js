import { world, system } from "@minecraft/server";
/**
 * Custom Item Pickup Event Manager
 * Karena Minecraft Bedrock tidak memiliki event pickup langsung,
 * kita monitoring perubahan inventory untuk mendeteksi item yang dipickup
 */
class ItemPickupEventManager {
    constructor() {
        this.playerInventories = new Map();
        this.callbacks = new Set();
        this.removeCallbacks = new Set();
        this.autoRemoveCallbacks = new Set();
        this.isRunning = false;
        this.autoRemoveItems = new Set();
    }
    /**
     * Mulai monitoring item pickup
     */
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.initializePlayerInventories();
        this.startMonitoring();
        // Listen untuk player join
        world.afterEvents.playerSpawn.subscribe((event) => {
            this.initializePlayerInventory(event.player);
        });
        console.log("[ItemPickup] Event manager started");
    }
    /**
     * Stop monitoring
     */
    stop() {
        this.isRunning = false;
        if (this.monitoringInterval) {
            system.clearRun(this.monitoringInterval);
        }
        console.log("[ItemPickup] Event manager stopped");
    }
    /**
     * Subscribe ke pickup event
     */
    subscribe(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }
    /**
     * Subscribe ke item remove event
     */
    subscribeRemove(callback) {
        this.removeCallbacks.add(callback);
        return () => this.removeCallbacks.delete(callback);
    }
    /**
     * Subscribe ke auto remove event (dipanggil saat item auto removed)
     */
    subscribeAutoRemove(callback) {
        this.autoRemoveCallbacks.add(callback);
        return () => this.autoRemoveCallbacks.delete(callback);
    }
    /**
     * Set item IDs yang akan otomatis dihapus dari inventory
     */
    setAutoRemoveItems(itemIds) {
        this.autoRemoveItems.clear();
        for (const itemId of itemIds) {
            this.autoRemoveItems.add(itemId);
        }
        console.log(`[ItemPickup] Auto-remove set for: ${itemIds.join(", ")}`);
    }
    /**
     * Tambah item ID ke auto remove list
     */
    addAutoRemoveItem(itemId) {
        this.autoRemoveItems.add(itemId);
        console.log(`[ItemPickup] Added ${itemId} to auto-remove list`);
    }
    /**
     * Hapus item ID dari auto remove list
     */
    removeAutoRemoveItem(itemId) {
        this.autoRemoveItems.delete(itemId);
        console.log(`[ItemPickup] Removed ${itemId} from auto-remove list`);
    }
    /**
     * Get current auto remove items list
     */
    getAutoRemoveItems() {
        return Array.from(this.autoRemoveItems);
    }
    /**
     * Initialize inventory snapshot untuk semua player
     */
    initializePlayerInventories() {
        for (const player of world.getAllPlayers()) {
            this.initializePlayerInventory(player);
        }
    }
    /**
     * Initialize inventory snapshot untuk player tertentu
     */
    initializePlayerInventory(player) {
        const inventory = player.getComponent("inventory");
        if (!inventory?.container)
            return;
        const snapshot = this.createInventorySnapshot(inventory.container);
        this.playerInventories.set(player.id, snapshot);
    }
    /**
     * Buat snapshot dari inventory container
     */
    createInventorySnapshot(container) {
        const snapshot = new Map();
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (item) {
                const key = `${item.typeId}_${i}`;
                snapshot.set(key, {
                    typeId: item.typeId,
                    amount: item.amount,
                    slot: i,
                    nameTag: item.nameTag,
                    lore: item.getLore(),
                });
            }
        }
        return snapshot;
    }
    /**
     * Mulai monitoring perubahan inventory
     */
    startMonitoring() {
        this.monitoringInterval = system.runInterval(() => {
            if (!this.isRunning) {
                if (this.monitoringInterval) {
                    system.clearRun(this.monitoringInterval);
                }
                return;
            }
            this.checkAllPlayers();
        }, 5); // Check setiap 5 ticks (0.25 detik)
    }
    /**
     * Check semua player untuk perubahan inventory
     */
    checkAllPlayers() {
        for (const player of world.getAllPlayers()) {
            try {
                this.checkPlayerInventory(player);
            }
            catch (error) {
                // Player mungkin sudah disconnect, skip
                continue;
            }
        }
    }
    /**
     * Check inventory player untuk item baru
     */
    checkPlayerInventory(player) {
        const inventory = player.getComponent("inventory");
        if (!inventory?.container)
            return;
        const oldSnapshot = this.playerInventories.get(player.id) || new Map();
        const newSnapshot = this.createInventorySnapshot(inventory.container);
        // Bandingkan snapshot untuk detect item baru
        this.compareSnapshots(player, oldSnapshot, newSnapshot);
        // Check dan auto remove item yang ada di blacklist
        this.checkAutoRemoveItems(player, inventory.container);
        // Update snapshot
        this.playerInventories.set(player.id, newSnapshot);
    }
    /**
     * Bandingkan dua snapshot inventory
     */
    /**
    * Bandingkan dua snapshot inventory - FIXED VERSION
    */
    compareSnapshots(player, oldSnapshot, newSnapshot) {
        // Check untuk item yang bertambah amount-nya (pickup)
        for (const [key, newItem] of newSnapshot) {
            const oldItem = oldSnapshot.get(key);
            if (!oldItem) {
                // Item baru di slot ini
                this.triggerPickupEvent(player, newItem, newItem.amount);
            }
            else if (newItem.amount > oldItem.amount) {
                // Amount bertambah di slot yang sama
                const pickedAmount = newItem.amount - oldItem.amount;
                this.triggerPickupEvent(player, newItem, pickedAmount);
            }
        }
        // Check untuk item yang berkurang amount-nya atau hilang (remove/use)
        for (const [key, oldItem] of oldSnapshot) {
            const newItem = newSnapshot.get(key);
            if (!newItem) {
                // Item hilang sepenuhnya dari slot ini
                this.triggerRemoveEvent(player, oldItem, oldItem.amount);
            }
            else if (oldItem.amount > newItem.amount) {
                // Amount berkurang di slot yang sama
                const removedAmount = oldItem.amount - newItem.amount;
                this.triggerRemoveEvent(player, oldItem, removedAmount);
            }
        }
        // REMOVED: The redundant slot-by-slot pickup detection that was causing duplicates
        // The key-based detection above already handles all pickup cases properly
    }
    /**
     * Check dan auto remove item yang ada di blacklist
     */
    checkAutoRemoveItems(player, container) {
        if (this.autoRemoveItems.size === 0)
            return;
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (!item)
                continue;
            if (this.autoRemoveItems.has(item.typeId)) {
                // Item ditemukan di blacklist, hapus
                const removedItem = {
                    typeId: item.typeId,
                    amount: item.amount,
                    slot: i,
                    nameTag: item.nameTag,
                    lore: item.getLore(),
                };
                try {
                    container.setItem(i, undefined); // Hapus item dari slot
                    this.triggerAutoRemoveEvent(player, removedItem);
                    console.log(`[AutoRemove] Removed ${removedItem.amount}x ${removedItem.typeId} from ${player.name}'s inventory`);
                }
                catch (error) {
                    console.error(`[AutoRemove] Failed to remove item from ${player.name}:`, error);
                }
            }
        }
    }
    /**
     * Trigger pickup event ke semua callback
     */
    triggerPickupEvent(player, itemData, amount) {
        const eventData = {
            player: player,
            item: {
                typeId: itemData.typeId,
                amount: amount,
                slot: itemData.slot,
                nameTag: itemData.nameTag,
                lore: itemData.lore,
            },
            timestamp: Date.now(),
        };
        // Panggil semua callback
        for (const callback of this.callbacks) {
            try {
                callback(eventData);
            }
            catch (error) {
                console.error("[ItemPickup] Error in callback:", error);
            }
        }
    }
    /**
     * Trigger remove event ke semua callback
     */
    triggerRemoveEvent(player, itemData, amount) {
        const eventData = {
            player: player,
            item: {
                typeId: itemData.typeId,
                amount: amount,
                slot: itemData.slot,
                nameTag: itemData.nameTag,
                lore: itemData.lore,
            },
            timestamp: Date.now(),
        };
        // Panggil semua remove callback
        for (const callback of this.removeCallbacks) {
            try {
                callback(eventData);
            }
            catch (error) {
                console.error("[ItemRemove] Error in callback:", error);
            }
        }
    }
    /**
     * Trigger auto remove event ke semua callback
     */
    triggerAutoRemoveEvent(player, itemData) {
        const eventData = {
            player: player,
            item: {
                typeId: itemData.typeId,
                amount: itemData.amount,
                slot: itemData.slot,
                nameTag: itemData.nameTag,
                lore: itemData.lore,
            },
            timestamp: Date.now(),
            reason: "auto_remove", // Tambah alasan untuk membedakan dengan remove biasa
        };
        // Panggil semua auto remove callback
        for (const callback of this.autoRemoveCallbacks) {
            try {
                callback(eventData);
            }
            catch (error) {
                console.error("[AutoRemove] Error in callback:", error);
            }
        }
    }
}
// Export instance global
export const itemPickupManager = new ItemPickupEventManager();
/**
 * Utility function untuk mudah subscribe ke pickup
 */
export function onItemPickup(callback) {
    return itemPickupManager.subscribe(callback);
}
/**
 * Utility function untuk mudah subscribe ke remove/use
 */
export function onItemRemove(callback) {
    return itemPickupManager.subscribeRemove(callback);
}
/**
 * Utility function untuk subscribe ke auto remove event
 */
export function onItemAutoRemove(callback) {
    return itemPickupManager.subscribeAutoRemove(callback);
}
/**
 * Set item IDs yang akan otomatis dihapus dari inventory
 */
export function setAutoRemoveItems(itemIds) {
    itemPickupManager.setAutoRemoveItems(itemIds);
}
/**
 * Tambah item ID ke auto remove list
 */
export function addAutoRemoveItem(itemId) {
    itemPickupManager.addAutoRemoveItem(itemId);
}
/**
 * Hapus item ID dari auto remove list
 */
export function removeAutoRemoveItem(itemId) {
    itemPickupManager.removeAutoRemoveItem(itemId);
}
/**
 * Get current auto remove items list
 */
export function getAutoRemoveItems() {
    return itemPickupManager.getAutoRemoveItems();
}
/**
 * Start monitoring (panggil ini di main script)
 */
export function startItemPickupMonitoring() {
    itemPickupManager.start();
}
/**
 * Stop monitoring
 */
export function stopItemPickupMonitoring() {
    itemPickupManager.stop();
}
