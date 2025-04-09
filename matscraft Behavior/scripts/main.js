import { ItemPickup } from "./events/itemPickup";
import { BlockBreakEvent } from "./events/blockBreak";
import { showMainMenu } from "./gui/menu";
import { initialize } from "./scoreboard/main";
import { world } from "@minecraft/server";
import "./onjoin/index.js";
import UserData from "./lib/dynamicDatabase.js";
import { getXUID } from "./lib/getXUID.js";
// ########### Block Break Event ###########
const blockBreakEvent = new BlockBreakEvent();
blockBreakEvent.initialize();

const itemPickup = new ItemPickup("matscraft:mats", 0, "Mats");
itemPickup.initialize();
initialize();

world.afterEvents.itemUse.subscribe(async (data) => {
  const player = data.source;
  console.log(data.itemStack.typeId);
  if (data.itemStack.typeId === "matsphone:matsphone") {
    player.sendMessage(`You used: ${data.itemStack.nameTag}`);
    showMainMenu(player);
  }
});
