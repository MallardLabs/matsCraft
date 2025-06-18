import blockBreak from "../events/blockBreak";
import { worldGetData, worldSetData } from "../utils/worldUtils";

import generateRandomString from "../utils/genRandomStr";
import CONFIG from "../config/config";
import { world, system } from "@minecraft/server";

import httpReq from "../lib/httpReq";
import { getPlayerData, showActionBar } from "../utils/playerUtils";
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
  const { player, blockId, location, toolTypeId, dimension } = data;
  const playerData = getPlayerData(player);

  /*
     If Player is not linked in the world, every block break activity by player it will be restored.
     So the unlinked players will not mess up in the world
  */

  if (!playerData || !playerData.data.is_linked) {
    actions.restore();
    actions.removeDropItem();
    return;
  }
  // Find The Pickaxe Ability
  const pickAxe = pickAxeAbility.find((p) => p.typeId === toolTypeId);

  //If players break block with pickaxe which doesn't match in the pickaxe ability, don't drop the item
  if (blockId.includes("matscraft:")) {
    if (!pickAxe) {
      return;
    }
    if (!pickAxe.allowed.includes(blockId)) {
      actions.removeDropItem();
    }

    /*
    Hopper Detector, this will detect 3x4 area to detect hopper is near in mats blocks
    */
    const radiusXZ = 4;
    const rangeUp = 3;
    const rangeDown = 4;

    // Find hoppers in the area 3x4
    for (let dx = -radiusXZ; dx <= radiusXZ; dx++) {
      for (let dz = -radiusXZ; dz <= radiusXZ; dz++) {
        for (let dy = -rangeDown; dy <= rangeUp; dy++) {
          const pos = {
            x: location.x + dx,
            y: location.y + dy,
            z: location.z + dz,
          };

          const block = dimension.getBlock(pos);
          if (block?.typeId.includes("hopper")) {
            showActionBar(
              player,
              "§cYou can't mine matsblocks near a hopper!"
            );
            return;
          }

          const entities = dimension.getEntitiesAtBlockLocation(pos);
          for (const e of entities) {
            if (e.typeId === "minecraft:hopper_minecart") {
              showActionBar(
                player,
                "§cYou can't mine matsblocks near a hopper minecart!"
              );
              return;
            }
          }
        }
      }
    }
    // PASS: If all the event before is pass then drop the item.
    actions.dropItem(
      CONFIG.ORE_CONFIG[
        blockId.replace("matscraft:", "") as keyof typeof CONFIG.ORE_CONFIG
      ]
    );

    // Store pending block to memory
    const blockData = createBlockData(
      playerData.xuid,
      blockId,
      location,
      toolTypeId
    );
    storePendingBlock(blockData);
  }
});

// Generate Block Data
const createBlockData = (
  xuid: number,
  blockName: string,
  location: any,
  toolTypeId: any
) => {
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
// Store pending block to the server
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
      log.info(
        "onBlockBreak",
        `Successfully saved ${data.length} blocks to database`
      );

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
