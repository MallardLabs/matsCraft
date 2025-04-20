import { world } from "@minecraft/server";
import { stringToBase62 } from "../lib/base62.js";
import { wait } from "../lib/wait.js";
import { showMainMenu } from "../gui/menu.js";

world.afterEvents.playerSpawn.subscribe(async ({ player, initialSpawn }) => {
  setPlayerData(player, initialSpawn);
  setDefaultItem(player);
});
const setPlayerData = async (player, initialSpawn) => {
  const playerData = player.getDynamicProperty("playerData");
  if (initialSpawn) {
    if (!playerData) {
      player.setDynamicProperty(
        "playerData",
        JSON.stringify({
          xuid: stringToBase62(player.id),
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
      wait(100).then(() => showMainMenu(player));
    }
  }
};

const setDefaultItem = (player) => {
  player.runCommandAsync(`clear @s matsphone:matsphone`);
  player.runCommandAsync(`give @s matsphone:matsphone 1`);
};
