import { world, system, ItemStack, Player, Container } from "@minecraft/server";

/**
 * Interface untuk item data dalam inventory snapshot
 */
interface InventoryItemData {
  typeId: string;
  amount: number;
  slot: number;
  nameTag?: string;
  lore: string[];
}

/**
 * Interface untuk event data yang dikirim ke callback
 */
interface ItemEventData {
  player: Player;
  item: {
    typeId: string;
    amount: number;
    slot: number;
    nameTag?: string;
    lore: string[];
  };
  timestamp: number;
  reason?: "auto_remove";
}

/**
 * Type untuk callback functions
 */
type ItemEventCallback = (eventData: ItemEventData) => void;
type UnsubscribeFunction = () => void;

/**
 * Custom Item Pickup Event Manager
 * Karena Minecraft Bedrock tidak memiliki event pickup langsung,
 * kita monitoring perubahan inventory untuk mendeteksi item yang dipickup
 */
class ItemPickupEventManager {
  private playerInventories: Map<string, Map<string, InventoryItemData>>;
  private callbacks: Set<ItemEventCallback>;
  private removeCallbacks: Set<ItemEventCallback>;
  private autoRemoveCallbacks: Set<ItemEventCallback>;
  private isRunning: boolean;
  private autoRemoveItems: Set<string>;
  private monitoringInterval?: number;

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
  public start(): void {
    if (this.isRunning) return;

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
  public stop(): void {
    this.isRunning = false;
    if (this.monitoringInterval) {
      system.clearRun(this.monitoringInterval);
    }
    console.log("[ItemPickup] Event manager stopped");
  }

  /**
   * Subscribe ke pickup event
   */
  public subscribe(callback: ItemEventCallback): UnsubscribeFunction {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Subscribe ke item remove event
   */
  public subscribeRemove(callback: ItemEventCallback): UnsubscribeFunction {
    this.removeCallbacks.add(callback);
    return () => this.removeCallbacks.delete(callback);
  }

  /**
   * Subscribe ke auto remove event (dipanggil saat item auto removed)
   */
  public subscribeAutoRemove(callback: ItemEventCallback): UnsubscribeFunction {
    this.autoRemoveCallbacks.add(callback);
    return () => this.autoRemoveCallbacks.delete(callback);
  }

  /**
   * Set item IDs yang akan otomatis dihapus dari inventory
   */
  public setAutoRemoveItems(itemIds: string[]): void {
    this.autoRemoveItems.clear();
    for (const itemId of itemIds) {
      this.autoRemoveItems.add(itemId);
    }
    console.log(`[ItemPickup] Auto-remove set for: ${itemIds.join(", ")}`);
  }

  /**
   * Tambah item ID ke auto remove list
   */
  public addAutoRemoveItem(itemId: string): void {
    this.autoRemoveItems.add(itemId);
    console.log(`[ItemPickup] Added ${itemId} to auto-remove list`);
  }

  /**
   * Hapus item ID dari auto remove list
   */
  public removeAutoRemoveItem(itemId: string): void {
    this.autoRemoveItems.delete(itemId);
    console.log(`[ItemPickup] Removed ${itemId} from auto-remove list`);
  }

  /**
   * Get current auto remove items list
   */
  public getAutoRemoveItems(): string[] {
    return Array.from(this.autoRemoveItems);
  }

  /**
   * Initialize inventory snapshot untuk semua player
   */
  private initializePlayerInventories(): void {
    for (const player of world.getAllPlayers()) {
      this.initializePlayerInventory(player);
    }
  }

  /**
   * Initialize inventory snapshot untuk player tertentu
   */
  private initializePlayerInventory(player: Player): void {
    const inventory = player.getComponent("inventory");
    if (!inventory?.container) return;

    const snapshot = this.createInventorySnapshot(inventory.container);
    this.playerInventories.set(player.id, snapshot);
  }

  /**
   * Buat snapshot dari inventory container
   */
  private createInventorySnapshot(
    container: Container
  ): Map<string, InventoryItemData> {
    const snapshot = new Map<string, InventoryItemData>();

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
  private startMonitoring(): void {
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
  private checkAllPlayers(): void {
    for (const player of world.getAllPlayers()) {
      try {
        this.checkPlayerInventory(player);
      } catch (error) {
        // Player mungkin sudah disconnect, skip
        continue;
      }
    }
  }

  /**
   * Check inventory player untuk item baru
   */
  private checkPlayerInventory(player: Player): void {
    const inventory = player.getComponent("inventory");
    if (!inventory?.container) return;

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
private compareSnapshots(
  player: Player,
  oldSnapshot: Map<string, InventoryItemData>,
  newSnapshot: Map<string, InventoryItemData>
): void {
  // Check untuk item yang bertambah amount-nya (pickup)
  for (const [key, newItem] of newSnapshot) {
    const oldItem = oldSnapshot.get(key);

    if (!oldItem) {
      // Item baru di slot ini
      this.triggerPickupEvent(player, newItem, newItem.amount);
    } else if (newItem.amount > oldItem.amount) {
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
    } else if (oldItem.amount > newItem.amount) {
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
  private checkAutoRemoveItems(player: Player, container: Container): void {
    if (this.autoRemoveItems.size === 0) return;

    for (let i = 0; i < container.size; i++) {
      const item = container.getItem(i);
      if (!item) continue;

      if (this.autoRemoveItems.has(item.typeId)) {
        // Item ditemukan di blacklist, hapus
        const removedItem: InventoryItemData = {
          typeId: item.typeId,
          amount: item.amount,
          slot: i,
          nameTag: item.nameTag,
          lore: item.getLore(),
        };

        try {
          container.setItem(i, undefined); // Hapus item dari slot
          this.triggerAutoRemoveEvent(player, removedItem);

          console.log(
            `[AutoRemove] Removed ${removedItem.amount}x ${removedItem.typeId} from ${player.name}'s inventory`
          );
        } catch (error) {
          console.error(
            `[AutoRemove] Failed to remove item from ${player.name}:`,
            error
          );
        }
      }
    }
  }

  /**
   * Trigger pickup event ke semua callback
   */
  private triggerPickupEvent(
    player: Player,
    itemData: InventoryItemData,
    amount: number
  ): void {
    const eventData: ItemEventData = {
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
      } catch (error) {
        console.error("[ItemPickup] Error in callback:", error);
      }
    }
  }

  /**
   * Trigger remove event ke semua callback
   */
  private triggerRemoveEvent(
    player: Player,
    itemData: InventoryItemData,
    amount: number
  ): void {
    const eventData: ItemEventData = {
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
      } catch (error) {
        console.error("[ItemRemove] Error in callback:", error);
      }
    }
  }

  /**
   * Trigger auto remove event ke semua callback
   */
  private triggerAutoRemoveEvent(
    player: Player,
    itemData: InventoryItemData
  ): void {
    const eventData: ItemEventData = {
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
      } catch (error) {
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
export function onItemPickup(callback: ItemEventCallback): UnsubscribeFunction {
  return itemPickupManager.subscribe(callback);
}

/**
 * Utility function untuk mudah subscribe ke remove/use
 */
export function onItemRemove(callback: ItemEventCallback): UnsubscribeFunction {
  return itemPickupManager.subscribeRemove(callback);
}

/**
 * Utility function untuk subscribe ke auto remove event
 */
export function onItemAutoRemove(
  callback: ItemEventCallback
): UnsubscribeFunction {
  return itemPickupManager.subscribeAutoRemove(callback);
}

/**
 * Set item IDs yang akan otomatis dihapus dari inventory
 */
export function setAutoRemoveItems(itemIds: string[]): void {
  itemPickupManager.setAutoRemoveItems(itemIds);
}

/**
 * Tambah item ID ke auto remove list
 */
export function addAutoRemoveItem(itemId: string): void {
  itemPickupManager.addAutoRemoveItem(itemId);
}

/**
 * Hapus item ID dari auto remove list
 */
export function removeAutoRemoveItem(itemId: string): void {
  itemPickupManager.removeAutoRemoveItem(itemId);
}

/**
 * Get current auto remove items list
 */
export function getAutoRemoveItems(): string[] {
  return itemPickupManager.getAutoRemoveItems();
}

/**
 * Start monitoring (panggil ini di main script)
 */
export function startItemPickupMonitoring(): void {
  itemPickupManager.start();
}

/**
 * Stop monitoring
 */
export function stopItemPickupMonitoring(): void {
  itemPickupManager.stop();
}

// =============================================================================
// TYPE EXPORTS untuk IntelliSense yang lebih baik
// =============================================================================

export type {
  ItemEventData,
  ItemEventCallback,
  UnsubscribeFunction,
  InventoryItemData,
};

