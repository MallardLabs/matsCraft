import { ItemPickup } from "./events/itemPickup";

import { showMainMenu } from "./gui/menu";
import { initialize } from "./scoreboard/main";
import { world, system } from "@minecraft/server";
import "./onjoin/index.js";
import "./events/blockBreak.js";
import { pickAxeAbility } from "./logic/pickaxeAbility.js";
const itemPickup = new ItemPickup("matscraft:mats", 0, "Mats");
itemPickup.initialize();
initialize();
console.log(JSON.stringify(pickAxeAbility, 1));
world.afterEvents.itemUse.subscribe(async (data) => {
  const player = data.source;
  console.log(data.itemStack.typeId);
  if (data.itemStack.typeId === "matsphone:matsphone") {
    player.sendMessage(`You used: ${player.id}`);
    showMainMenu(player);
  }
});
