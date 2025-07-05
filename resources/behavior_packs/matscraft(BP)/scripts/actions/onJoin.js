import { system, world } from "@minecraft/server";
import getXUID from "../lib/getXUID";
import logger from "../utils/logger";
import { httpReq } from "../lib/httpReq";
import { variables } from "@minecraft/server-admin";
import genSecret from "../lib/genSecret";
/**
 * Handles player spawn events.
 * Gives default item and processes player data on first join.
 */
world.afterEvents.playerSpawn.subscribe(async ({ player, initialSpawn }) => {
    giveDefaultItem(player);
    if (initialSpawn) {
        const xuid = player.getDynamicProperty("xuid");
        // If the player does not yet have an XUID saved, fetch and set it
        if (!xuid) {
            logger.info("onJoin ( XUID Fetcher )", `Player ${player.nameTag} has no XUID. Fetching XUID...`);
            const fetchedXUID = await getXUID(player);
            player.setDynamicProperty("xuid", fetchedXUID);
            logger.info("onJoin ( XUID Fetcher )", `Player ${player.nameTag} XUID set to: ${fetchedXUID}`);
        }
        // Handle initial spawn logic like syncing player data from the cloud
        handleInitialSpawn(player);
    }
});
/**
 * Main handler for first-time player spawn.
 * Fetches player data from backend and applies it, or resets if not found.
 */
const handleInitialSpawn = (player) => {
    system.run(async () => {
        const xuid = player.getDynamicProperty("xuid");
        const response = await fetchPlayerData(xuid);
        if (response.status !== 200) {
            console.log(`Player ${player.nameTag} not found in database. Resetting data...`);
            resetPlayerData(player);
            return showLoginAlert(player);
        }
        const playerCloudData = JSON.parse(response.body);
        setPlayerData(player, playerCloudData);
        logger.info("onJoin ( Sync Player Cloud Data )", JSON.stringify(playerCloudData));
    });
};
/**
 * Gives the player their default phone item upon joining.
 */
const giveDefaultItem = (player) => {
    player.runCommand(`clear @s matsphone:matsphone`);
    player.runCommand(`give @s matsphone:matsphone 1`);
};
/**
 * Fetches player data from the backend using their XUID.
 */
const fetchPlayerData = async (xuid) => {
    return await httpReq({
        method: "get",
        url: `${variables.get("BASE_URL")}/users/${xuid}`,
        headers: {
            "Content-Type": "application/json",
            "matscraft-secret": genSecret(),
        },
    });
};
/**
 * Resets a player's local data and scores if they are not found in the backend.
 */
const resetPlayerData = (player) => {
    system.run(() => {
        world.scoreboard
            .getObjective("Mats")
            ?.setScore(player.scoreboardIdentity, 0);
        world.scoreboard
            .getObjective("Huh")
            ?.setScore(player.scoreboardIdentity, 0);
        player.setDynamicProperty("is_linked", false);
        player.setDynamicProperty("discord_id", false);
        player.setDynamicProperty("discord_username", false);
    });
};
/**
 * Applies cloud-stored player data to their local game state.
 */
const setPlayerData = (player, data) => {
    system.run(() => {
        world.scoreboard
            .getObjective("Mats")
            ?.setScore(player.scoreboardIdentity, data.mats);
        world.scoreboard
            .getObjective("Huh")
            ?.setScore(player.scoreboardIdentity, data.huh);
        player.setDynamicProperty("is_linked", true);
        player.setDynamicProperty("discord_id", data.discord_id);
        player.setDynamicProperty("discord_username", data.discord_username);
    });
};
/**
 * Displays an action bar login alert to the player.
 */
const showLoginAlert = (player) => {
    player.runCommand(`title @s actionbar {"text":"Login","color":"red","bold":true}`);
};
