import { world } from "@minecraft/server";
import showMainMenu from "../gui/main";
import admin from "../gui/admin";

world.afterEvents.itemUse.subscribe(async (data) => {
  const player = data.source;
  if (data.itemStack.typeId === "matsphone:matsphone") {
    if (!player.hasTag("admin")) {
      showMainMenu(player);
      return;
    }
    admin(player);
  }
});
