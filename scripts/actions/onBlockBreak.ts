import blockBreak from "../events/blockBreak";
import { worldGetData, worldSetData } from "../utils/worldUtils";

import generateRandomString from "../utils/genRandomStr";
import CONFIG from "../config/config";
import { world } from "@minecraft/server";

import httpReq from "../lib/httpReq";
import { getPlayerData } from "../utils/playerUtils";
import genSecret from "../lib/genSecret";
import log from "../utils/logger";
const pickAxeAbility = [
  {
    typeId: "matscraft:nanndo_pickaxe",
    allowed: ["matscraft:common_mats_ore", "matscraft:uncommon_mats_ore"],
  },
  {
    typeId: "matscraft:lowpolyduck_pickaxe",
    allowed: [
      "matscraft:common_mats_ore",
      "matscraft:uncommon_mats_ore",
      "matscraft:rare_mats_ore",
      "matscraft:epic_mats_ore",
    ],
  },
  {
    typeId: "matscraft:mezo_pickaxe",
    allowed: [
      "matscraft:common_mats_ore",
      "matscraft:uncommon_mats_ore",
      "matscraft:rare_mats_ore",
      "matscraft:epic_mats_ore",
      "matscraft:legendary_mats_ore",
    ],
  },
];

blockBreak.listen((data, actions) => {
  const { player, blockId, location, toolTypeId } = data;
  const playerData = getPlayerData(player);
 
  if (!playerData || !playerData.data.is_linked) {
    actions.restore();
    actions.removeDropItem();
    return;
  }
  const pickAxe = pickAxeAbility.find((p) => p.typeId === toolTypeId);

  if (blockId.includes("matscraft:")) {
    if (!pickAxe || !pickAxe.allowed.includes(blockId)) {
      actions.removeDropItem();
     
    }
    const blockData = createBlockData(playerData.xuid, blockId, location, toolTypeId);
    storePendingBlock(blockData);
  }
});

const createBlockData = (xuid: number, blockName: string, location: any, toolTypeId: any) => {
  return {
    hash: generateRandomString(),
    minecraft_id: xuid,
    block_name: blockName.replace("matscraft:", ""),
    location: {
      x: location.x,
      y: location.y,
      z: location.z,
    },
    pickaxe: toolTypeId.replace("matscraft:", ""),
    mined_at: new Date().toISOString(),
  };
};

const storePendingBlock = async (data: any) => {
  let blockData =
    (worldGetData("pendingBlock") as string) ??
    worldSetData("pendingBlock", JSON.stringify([]));
  let parsed = [];

  try {
    parsed = blockData ? JSON.parse(blockData) : [];
  } catch (err) {
    console.error("Failed to parse pendingBlock:", err);
  }

  parsed.push(data);
  if (parsed.length >= 10) {
    await updateBlock(parsed);
  } else {
    world.setDynamicProperty("pendingBlock", JSON.stringify(parsed));
  }
};
const updateBlock = async (data: any) => {
  try {
    const response = await httpReq.request({
      method: "POST",
      url: CONFIG.INSERT_BLOCK,
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        "matscraft-secret": genSecret(),
      },
    });

    if (response.status === 200) {
      log.info("onBlockBreak",`Successfully saved ${data.length} blocks to database`);

      world.setDynamicProperty("pendingBlock", JSON.stringify([]));
    } else {
      console.error(
        `Failed to save blocks: ${response.status} - ${response.body}`
      );
      world.setDynamicProperty("pendingBlock", JSON.stringify(data));
    }
  } catch (error: any) {
    console.error(`Error sending blocks to database: ${error.message}`);
    world.setDynamicProperty("pendingBlock", JSON.stringify(data));
  }
};
