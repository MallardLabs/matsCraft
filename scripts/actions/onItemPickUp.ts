import { world, Player } from "@minecraft/server";
import { onItemPickup } from "../events/itemPickup";
import httpReq from "../lib/httpReq";
import {
  getPlayerData,
  showActionBar,
  setPlayerScore,
  getPlayerScore,
} from "../utils/playerUtils";
import CONFIG from "../config/config";
import genSecret from "../lib/genSecret";
import log from "../utils/logger";

// --------------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------------

interface PickedItemMap {
  mats: number;
  huh: number;
}

interface PendingUpdate {
  minecraft_id: string;
  discord_id: string;
  picked_item: PickedItemMap;
  last_update: number;
}

interface TrackedItem {
  id: keyof PickedItemMap;
  scoreId: string;
  displayName: string;
}

// --------------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------------

const SYNC_INTERVAL = 20; // seconds

const TRACKED_ITEMS: Record<string, TrackedItem> = {
  "matscraft:mats": { id: "mats", scoreId: "Mats", displayName: "Mats" },
  "matscraft:huh": { id: "huh", scoreId: "Huh", displayName: "Huh" },
} as const;

const PARENT_MAP: Record<keyof PickedItemMap, keyof PickedItemMap | null> = {
  mats: null,
  huh: null,
} as const;

// --------------------------------------------------------------------------------
// Storage Management
// --------------------------------------------------------------------------------

class PendingUpdatesManager {
  private static readonly STORAGE_KEY = "pendingUpdates";

  static get(): PendingUpdate[] {
    const raw = (world.getDynamicProperty(this.STORAGE_KEY) as string) || "[]";
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn("[PendingUpdates] Invalid format. Resetting.", error);
      return [];
    }
  }

  static set(updates: PendingUpdate[]): void {
    world.setDynamicProperty(this.STORAGE_KEY, JSON.stringify(updates));
  }

  static findByDiscordId(discordId: string): PendingUpdate | undefined {
    return this.get().find(update => update.discord_id === discordId);
  }

  static createNewEntry(playerData: any, xuid: string): PendingUpdate {
    return {
      minecraft_id: xuid,
      discord_id: playerData.data.discord_id,
      picked_item: { mats: 0, huh: 0 },
      last_update: Math.floor(Date.now() / 1000) + SYNC_INTERVAL,
    };
  }
}

// --------------------------------------------------------------------------------
// Database Sync
// --------------------------------------------------------------------------------

class DatabaseSync {
  static async syncToDatabase(player: Player, entry: PendingUpdate): Promise<boolean> {
    const payload = this.buildPayload(entry.picked_item);
    
    if (Object.keys(payload).length === 0) {
      log.info("Item Pickup","No data to sync");
      return true;
    }

    try {
      const response = await httpReq.request({
        method: "POST",
        url: `${CONFIG.UPDATE_BALANCE}/${entry.minecraft_id}/update_balance?type=item_pickup`,
        headers: {
          "Content-Type": "application/json",
          "matscraft-secret": genSecret(),
        },
        body: JSON.stringify({
          data: payload,
        }),
      });

      if (response.status !== 200) {
        log.warn("Item Pickup",`Failed to sync with status: ${response.status}\n Response: ${response.body}`);
        return false;
      }

      const responseData = JSON.parse(response.body);
      this.updatePlayerScores(player, responseData);
      
      console.log("[Sync] Success:", payload);
      return true;
    } catch (error) {
      console.error("[Sync] Error:", error);
      return false;
    }
  }

  private static buildPayload(pickedItems: PickedItemMap): Partial<PickedItemMap> {
    const payload: Partial<PickedItemMap> = {};

    if (pickedItems.mats > 0) {
      payload.mats = pickedItems.mats;
    }

    if (pickedItems.huh > 0) {
      payload.huh = pickedItems.huh;
    }

    return payload;
  }

  private static updatePlayerScores(player: Player, responseData: any): void {
    const { mats, huh } = responseData.balance;
    log.info("Item Pickup",`Updating player scores: mats=${mats}, huh=${huh}`);
    setPlayerScore(player, "Mats", mats);
    setPlayerScore(player, "Huh", huh);
  }
}

// --------------------------------------------------------------------------------
// Item Processing
// --------------------------------------------------------------------------------

class ItemProcessor {
  static async processPickup(player: Player, item: any): Promise<void> {
    const trackedItem = TRACKED_ITEMS[item.typeId];
    if (!trackedItem) return;

    const playerData = getPlayerData(player);
    if (!playerData?.data.is_linked) return;

    const now = Math.floor(Date.now() / 1000);
    const updates = PendingUpdatesManager.get();
    
    let updateEntry = updates.find(u => u.discord_id === playerData.data.discord_id);
    
    if (!updateEntry) {
      updateEntry = PendingUpdatesManager.createNewEntry(playerData, playerData.xuid);
      updates.push(updateEntry);
    }

    // Check if sync is needed (expired)
    const needsSync = now >= updateEntry.last_update;
    
    if (needsSync) {
      // Sync existing data first
      const syncSuccess = await DatabaseSync.syncToDatabase(player, updateEntry);
      
      if (syncSuccess) {
        // Reset the synced data and update timer
        updateEntry.picked_item = { mats: 0, huh: 0 };
        updateEntry.last_update = now + SYNC_INTERVAL;
      } else {
        // If sync failed, don't reset data and try again later
        console.warn("[Sync] Failed to sync, retrying later");
      }
    }

    // Add new item data (this will be included in current or next sync)
    this.addItemToEntry(updateEntry, trackedItem, item.amount);
    
    // If we just synced successfully and have new data, sync immediately
    if (needsSync && this.hasDataToSync(updateEntry.picked_item)) {
      const immediateSync = await DatabaseSync.syncToDatabase(player, updateEntry);
      if (immediateSync) {
        updateEntry.picked_item = { mats: 0, huh: 0 };
        updateEntry.last_update = now + SYNC_INTERVAL;
      }
    }

    // Save all changes
    PendingUpdatesManager.set(updates);

    // Provide user feedback
    this.showPickupFeedback(player, trackedItem, item.amount);
  }

  private static addItemToEntry(entry: PendingUpdate, trackedItem: TrackedItem, amount: number): void {
    // Add to main item count
    entry.picked_item[trackedItem.id] += amount;
    
    // Add to parent item count if exists
    const parentId = PARENT_MAP[trackedItem.id];
    if (parentId) {
      entry.picked_item[parentId] += amount;
    }
  }

  private static hasDataToSync(pickedItems: PickedItemMap): boolean {
    return Object.values(pickedItems).some(count => count > 0);
  }

  private static showPickupFeedback(player: Player, trackedItem: TrackedItem, amount: number): void {
    showActionBar(player, `§a${amount} ${trackedItem.displayName} Collected!`);
    
    const currentScore = getPlayerScore(player, trackedItem.scoreId);
    setPlayerScore(player, trackedItem.scoreId, currentScore + amount);
  }
}

// --------------------------------------------------------------------------------
// Event Handler Registration
// --------------------------------------------------------------------------------

onItemPickup(async ({ player, item }) => {
  try {
    await ItemProcessor.processPickup(player, item);
  } catch (error) {
    console.error("[ItemPickup] Unexpected error:", error);
  }
});