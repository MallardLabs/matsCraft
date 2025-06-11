import { world } from "@minecraft/server";
import showMainMenu from "../gui/main";

world.afterEvents.itemUse.subscribe(async (data) => {
  const player = data.source;
  if (data.itemStack.typeId === "matsphone:matsphone") {
    showMainMenu(player);
  }
});
