import "./actions/onJoin";
import "./actions/onBlockBreak";
import "./actions/onItemUse";
import CONFIG from "./config/config";
import "./actions/onItemPickUp";
import {
  startItemPickupMonitoring,
  setAutoRemoveItems,
} from "./events/itemPickup";
import log from "./utils/logger";
import {world,Player,ItemStack, BlockVolumeBase} from "@minecraft/server";
import "./actions/onLobby"
import { get } from "http";
startItemPickupMonitoring();

setAutoRemoveItems(["matscraft:mats", "matscraft:huh","matscraft:common_mats_ore","matscraft:uncommon_mats_ore","matscraft:rare_mats_ore","matscraft:epic_mats_ore","matscraft:legendary_mats_ore"]);
log.info(
  "CONFIG",
  `BASE_URL=${CONFIG.BASE_URL} | SECRET_KEY=${CONFIG.SECRET_KEY}`
);

world.getDimension("overworld").getPlayers().forEach((player) => {
 console.log(`[${player.nameTag}]`, JSON.stringify(getPlayerInventoryJSON(player)));
});

function getPlayerInventoryJSON(player:Player) {
  const inventoryComp = player.getComponent("inventory");
  const container = inventoryComp?.container;
  if (!container) return [];

  const inventoryData = [];

  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item) {
      inventoryData.push({
        slot: i,
        typeId: item.typeId,
        amount: item.amount,
        nameTag: item.nameTag || null
      });
    } else {
      inventoryData.push(null); // slot kosong
    }
  }

  return inventoryData;
}

