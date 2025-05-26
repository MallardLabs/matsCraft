import { world } from "@minecraft/server";
import { initialize as initializeScoreboard } from "../scoreboard/main";
import { getXUID, getPlayerData, updatePlayerData, setPlayerScore, } from "../utils/playerUtils";
import wait from "../utils/wait";
import loginAlert from "../gui/loginAlert";
import httpReq from "../lib/httpReq";
import CONFIG from "../config/config";
import genSecret from "../lib/genSecret";
initializeScoreboard();
world.afterEvents.playerSpawn.subscribe(async ({ player, initialSpawn }) => {
    const playerData = getPlayerData(player);
    setDefaultItem(player);
    if (initialSpawn) {
        await handleInitialSpawn(player, playerData);
    }
    if (!playerData?.data?.is_linked) {
        showLoginAlertWithDelay(player);
    }
});
async function handleInitialSpawn(player, playerData) {
    if (!playerData) {
        await initializeUnlinkedPlayer(player);
        return;
    }
    const xuid = playerData.xuid;
    console.log(`Syncing player data for ${player.nameTag} (xuid: ${xuid})`);
    const data = await fetchPlayerBalance(xuid);
    const body = JSON.parse(data.body);
    if (!body.is_verified || body?.message === "User not found") {
        await resetUnlinkedPlayer(player);
        return;
    }
    initializePlayerData(player, body);
}
async function initializeUnlinkedPlayer(player) {
    console.log(`No player data found for ${player.nameTag}`);
    const xuid = await getXUID(player);
    updatePlayerData(player, { xuid, data: { is_linked: false } });
}
async function resetUnlinkedPlayer(player) {
    const xuid = await getXUID(player);
    setPlayerScore(player, "Mats", 0);
    updatePlayerData(player, { xuid, data: { is_linked: false } });
}
async function fetchPlayerBalance(xuid) {
    return httpReq.request({
        method: "GET",
        url: `${CONFIG.GET_BALANCE}/${xuid}`,
        headers: {
            "Content-Type": "application/json",
            matscraft_token: genSecret(),
        },
    });
}
function initializePlayerData(player, data) {
    setPlayerScore(player, "Mats", data.balance);
    updatePlayerData(player, {
        xuid: data.xuid,
        data: {
            is_linked: true,
            discord_username: data.discord_username,
            discord_id: data.discord_id,
        },
    });
}
function showLoginAlertWithDelay(player) {
    wait(200).then(() => {
        loginAlert(player);
    });
}
// Set default item
const setDefaultItem = (player) => {
    player.runCommandAsync(`clear @s matsphone:matsphone`);
    player.runCommandAsync(`give @s matsphone:matsphone 1`);
};
