import {
   ItemStack,
   Player,
   PlayerInventoryItemChangeAfterEvent,
   system,
   world,
} from "@minecraft/server";
import logger from "../utils/logger";
import { httpReq } from "../lib/httpReq";
import { variables } from "@minecraft/server-admin";
import genSecret from "../lib/genSecret";
import {
   addPlayerScore,
   getPlayerData,
   setPlayerScore,
   showActionBar,
} from "../utils/player/index";

class OnItemPickup {
   private static readonly TRACKED_ITEMS = [
      "matscraft:mats",
      "matscraft:huh",
      "matscraft:common_mats_ore",
      "matscraft:uncommon_mats_ore",
      "matscraft:rare_mats_ore",
      "matscraft:epic_mats_ore",
      "matscraft:legendary_mats_ore",
   ];

   static handleItemPickup(event: PlayerInventoryItemChangeAfterEvent) {
      const { player, itemStack } = event;

      if (!itemStack || !itemStack.typeId) return;
      if (!this.isTrackedItem(itemStack.typeId)) return;
      if (player.hasTag("admin")) return;
      if (!itemStack.typeId.includes("ore")) {
         this.processItemPickup(player, itemStack);
         console.log(
            `${player.nameTag} §aPicked Up ${itemStack.amount} ${itemStack.typeId.replace(
               "matscraft:",
               ""
            )}!`
         );
         showActionBar(
            player,
            `§aPicked Up ${itemStack.amount} ${itemStack.typeId.replace("matscraft:", "")}!`
         );
         addPlayerScore(
            player,
            itemStack.typeId === "matscraft:mats" ? "Mats" : "Huh",
            itemStack.amount
         );
      }
      this.removeItem(player);
   }

   private static isTrackedItem(typeId: string): boolean {
      return this.TRACKED_ITEMS.includes(typeId);
   }

   private static removeItem(player: Player) {
      const inventory = player.getComponent("minecraft:inventory")?.container;
      if (!inventory) return;

      for (let i = 0; i < inventory.size; i++) {
         const item = inventory.getItem(i);
         if (!item) continue;

         if (this.isTrackedItem(item.typeId)) {
            inventory.setItem(i, undefined);
         }
      }
   }

   private static processItemPickup(player: Player, itemStack: ItemStack) {
      const { typeId, amount } = itemStack;
      const pendingUpdate = this.getPendingUpdates(player);

      // Pastikan pendingUpdate.data selalu ada
      if (!pendingUpdate.data) {
         pendingUpdate.data = {};
      }

      // Tambahkan key jika belum ada, lalu update nilainya
      if (typeId.includes("mats")) {
         if (!("mats" in pendingUpdate.data)) {
            pendingUpdate.data.mats = 0;
         }
         pendingUpdate.data.mats += amount;
      }

      if (typeId.includes("huh")) {
         if (!("huh" in pendingUpdate.data)) {
            pendingUpdate.data.huh = 0;
         }
         pendingUpdate.data.huh += amount;
      }
      this.setPendingUpdates(player, pendingUpdate);

      if (pendingUpdate.last_update + 30000 < Date.now()) {
         this.syncUpdates(player);
      }
   }

   private static getPendingUpdates(player: Player) {
      const playerData = getPlayerData(player);
      const pendingUpdate = player.getDynamicProperty("pendingUpdate") as string;
      const template = {
         xuid: playerData.xuid,
         last_update: Date.now(),
      };
      if (pendingUpdate) {
         return JSON.parse(pendingUpdate);
      }
      return template;
   }
   private static setPendingUpdates(player: Player, data: any) {
      player.setDynamicProperty("pendingUpdate", JSON.stringify(data));
   }
   private static syncUpdates(player: Player) {
      const pendingUpdate = this.getPendingUpdates(player);
      const { xuid, data } = pendingUpdate;
      const secret = genSecret();
      const body = { data: data };
      const res = httpReq({
         method: "post",
         url: `${variables.get("BASE_URL")}/users/${xuid}/update_balance?type=item_pickup`,
         headers: {
            "Content-Type": "application/json",
            "matscraft-secret": secret,
         },
         data: JSON.stringify(body),
      });
      res.then((res) => {
         if (res.status === 200) {
            const { mats, huh } = JSON.parse(res.body).balance;
            setPlayerScore(player, "Mats", mats);
            setPlayerScore(player, "Huh", huh);
            const output = Object.entries(data)
               .map(([key, value]) => `${key}: ${value}`)
               .join("\n");

            logger.info("SYNC", `Synced ${player.nameTag} balance\n${output}`);
            this.setPendingUpdates(player, {
               xuid,
               last_update: Date.now(),
            });
         }
      });
   }
}

world.afterEvents.playerInventoryItemChange.subscribe((event) =>
   OnItemPickup.handleItemPickup(event)
);
