import { world } from "@minecraft/server";
import httpReq from "../lib/httpReq";
import { get } from "http";

export const getPlayerScore = (player: any, objectiveName: string) => {
  const objective = world.scoreboard.getObjective(objectiveName) || null;
  return objective ? objective.getScore(player.scoreboardIdentity) || 0 : 0;
};

export const setPlayerScore = (
  player: any,
  objectiveName: string,
  score: number
) => {
  player.runCommand(`scoreboard players set @s ${objectiveName} ${score}`);
};

export const showActionBar = (player: any, message: string) => {
  player.runCommand("playsound random.pop @s");
  player.runCommand(`title @s actionbar ${message}`);
};

export const giveItem = (player: any, itemId: string, amount = 1) => {
  player.runCommand(`give @s ${itemId} ${amount}`);
};
export async function getXUID(player: any): Promise<number | null> {
  const { nameTag } = player;

  try {
    // First try using mcprofile.io
    const primaryResponse = await httpReq.request({
      method: "GET",
      url: `https://mcprofile.io/api/v1/bedrock/gamertag/${nameTag}`,
      headers: { "Content-Type": "application/json" },
    });

    const primaryData = JSON.parse(primaryResponse.body);

    // if it succeeds, return the XUID
    if (primaryData?.xuid) {
      console.warn(`XUID for ${nameTag} (mcprofile.io): ${primaryData.xuid}`);
      return primaryData.xuid;
    }

    // if it fails, fallback to geysermc.org
    const fallbackResponse = await httpReq.request({
      method: "GET",
      url: `https://api.geysermc.org/v2/xbox/xuid/${nameTag}`,
      headers: { "Content-Type": "application/json" },
    });

    const fallbackData = JSON.parse(fallbackResponse.body);

    // if it succeeds, return the XUID
    if (fallbackData?.xuid) {
      console.warn(`XUID for ${nameTag} (geysermc.org): ${fallbackData.xuid}`);
      return fallbackData.xuid;
    }

    return null;
  } catch (error) {
    console.warn(`Error fetching XUID for ${nameTag}:`, error);
    return null;
  }
}

export const getPlayerData = (player?: any) => {
  const xuid = player.getDynamicProperty("xuid");
  const discord_id = player.getDynamicProperty("discord_id");
  const discord_username = player.getDynamicProperty("discord_username");
  const is_linked = player.getDynamicProperty("is_linked");
  return {
    xuid: xuid ? xuid : null,
    data: {
      is_linked: is_linked ? true : false,
      discord_id: discord_id ? discord_id : null,
      discord_username: discord_username ? discord_username : null,
    },
  };
};
export const setPlayerData = (
  player?: any,
  type?: string | number,
  value?: string | number | boolean | null
) => {
  player.setDynamicProperty(type, value);
  return player.getDynamicProperty(type);
}
export const updatePlayerData = (
  player?: any,
  type?: string | number,
  value?: string | number | boolean | null
) => {
  player.setDynamicProperty(type, value);
};
