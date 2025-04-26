import { ItemPickup } from "./events/itemPickup";

import { showMainMenu } from "./gui/main.js";
import { initialize } from "./scoreboard/main";
import { world, system } from "@minecraft/server";

import "./onjoin/index.js";
import "./events/blockBreak.js";
import { ENDPOINTS } from "./config/endpoints.js";
import { variables } from "@minecraft/server-admin";
const itemPickup = new ItemPickup("matscraft:mats", 0, "Mats");
itemPickup.initialize();
initialize();

console.info(`================ CONFIG ===================`)
console.info(`SECRET KEY: ${variables.get("SECRET_KEY")}`)
console.info(`API_BASE_URL: ${ENDPOINTS.BASE_URL}`)
console.info(`================ CONFIG ===================`)

world.afterEvents.itemUse.subscribe(async (data) => {
  const player = data.source;
  if (data.itemStack.typeId === "matsphone:matsphone") {
    showMainMenu(player);
  }
});
