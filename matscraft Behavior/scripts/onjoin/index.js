import { getXUID } from "../lib/getXUID.js";
import { world } from "@minecraft/server";

import { wait } from "../lib/wait.js";
import { showMainMenu } from "../gui/menu.js";
import UserData from "../lib/dynamicDatabase.js";

world.afterEvents.playerSpawn.subscribe(async ({ player, initialSpawn }) => {
  const playerData = player.getDynamicProperty("playerData");
  if (initialSpawn) {
    if (!playerData) {
      player.setDynamicProperty(
        "playerData",
        JSON.stringify({
          xuid: await getXUID(player),
          data: {
            is_linked: false,
            discord_id: null,
            discord_username: null,
          },
        })
      );
      console.log(`playerData Is Created: ${playerData}`);
      return;
    }
    if (!JSON.parse(playerData).data.is_linked) {
      wait(60).then(() => showMainMenu(player));
    }
  }
});
