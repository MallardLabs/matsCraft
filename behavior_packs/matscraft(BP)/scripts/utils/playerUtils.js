import { world } from "@minecraft/server";
import httpReq from "../lib/httpReq";
export const getPlayerScore = (player, objectiveName) => {
    const objective = world.scoreboard.getObjective(objectiveName) || null;
    return objective ? objective.getScore(player.scoreboardIdentity) || 0 : 0;
};
export const setPlayerScore = (player, objectiveName, score) => {
    player.runCommand(`scoreboard players set @s ${objectiveName} ${score}`);
};
export const showActionBar = (player, message) => {
    player.runCommand("playsound random.pop @s");
    player.runCommand(`title @s actionbar ${message}`);
};
export const giveItem = (player, itemId, amount = 1) => {
    player.runCommand(`give @s ${itemId} ${amount}`);
};
export async function getXUID(player) {
    try {
        const response = await httpReq.request({
            method: "GET",
            url: `https://api.geysermc.org/v2/xbox/xuid/${player.nameTag}`,
            headers: {
                "Content-Type": "application/json",
            },
        });
        const body = JSON.parse(response.body);
        console.warn(`XUID for ${player.nameTag}: ${body.xuid}`);
        return body.xuid;
    }
    catch (error) {
        console.warn(`Error fetching XUID: ${error}`);
        return null;
    }
}
export const getPlayerData = (player) => {
    const data = player.getDynamicProperty("playerData");
    if (data) {
        return JSON.parse(data);
    }
    return null;
};
export const updatePlayerData = (player, playerData) => {
    player.setDynamicProperty("playerData", JSON.stringify(playerData));
};
