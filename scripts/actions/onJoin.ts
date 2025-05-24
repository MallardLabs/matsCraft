import { world } from "@minecraft/server";
import { initialize as initializeScoreboard } from "../scoreboard/main";
import {
  getXUID,
  getPlayerData,
  updatePlayerData,
  setPlayerScore,
} from "../utils/playerUtils";
import wait from "../utils/wait";
import loginAlert from "../gui/loginAlert";
import httpReq from "../lib/httpReq";
import CONFIG from "../config/config";
import genSecret from "../lib/genSecret";
initializeScoreboard();

world.afterEvents.playerSpawn.subscribe(async ({ player, initialSpawn }) => {
  const playerData = getPlayerData(player);
  setDefaultItem(player);

  // Check If first on the server
  if (initialSpawn) {
    // Get player XUID
    if (!playerData) {
      const xuid = await getXUID(player);
      updatePlayerData(player, { xuid: xuid, data: { is_linked: false } });
      return;
    }

    // Update balance when player joins
    const xuid = playerData.xuid;
    const data = await httpReq.request({
      method: "GET",
      url: `${CONFIG.GET_BALANCE}/${xuid}`,
      headers: {
        "Content-Type": "application/json",
        matscraft_token: genSecret(),
      },
    });
    const body = JSON.parse(data.body);
    setPlayerScore(player, "Mats", body.balance);
  }

  // Check if player is linked
  if (!playerData.data.is_linked) {
    // show login alert if player is not linked their account
    wait(200).then(() => {
      loginAlert(player);
    });
  }
});

// Set default item
const setDefaultItem = (player: any) => {
  player.runCommandAsync(`clear @s matsphone:matsphone`);
  player.runCommandAsync(`give @s matsphone:matsphone 1`);
};
