import { world } from "@minecraft/server";
import { httpReq } from "../lib/httpReq.js";
import { config } from "../config/index.js";
import { generateRandomString } from "../utils/genRandomStr.js";
import { generateISOTimestamp } from "../utils/generateTimestamp.js";
import { getPlayerData } from "../utils/playerUtils.js";

/**
 * Retrieves or initializes the pending blocks data.
 * @returns {Array} - Array of pending block data.
 */
const getPendingBlocks = () => {
  try {
    const data = world.getDynamicProperty("pendingBlock");
    if (!data) {
      world.setDynamicProperty("pendingBlock", JSON.stringify([]));
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error(`Failed to parse pendingBlock: ${error.message}`);
    world.setDynamicProperty("pendingBlock", JSON.stringify([]));
    return [];
  }
};

/**
 * Saves block data to the pending list and sends to database if limit is exceeded.
 * @param {Object} blockData - The mined block data.
 */
const savePendingBlock = async (blockData) => {
  const pendingBlocks = getPendingBlocks();
  pendingBlocks.push(blockData);
  world.setDynamicProperty("pendingBlock", JSON.stringify(pendingBlocks));

  if (pendingBlocks.length >= 10) {
    console.log("Pending block limit reached, sending to database...");
    await sendBlocksToDatabase(pendingBlocks);
    world.setDynamicProperty("pendingBlock", JSON.stringify([]));
  }
};

/**
 * Sends block data to the database.
 * @param {Array} blocks - List of blocks to send.
 */
const sendBlocksToDatabase = async (blocks) => {
  try {
    const response = await httpReq.request({
      method: "POST",
      url: config.ENDPOINTS.SAVE_BLOCKS,
      body: JSON.stringify(blocks),
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 200) {
      console.log("Successfully saved blocks to database");
    } else {
      console.error(`Failed to save blocks: ${response.status} - ${response.body}`);
      // Save back to pending if failed
      world.setDynamicProperty("pendingBlock", JSON.stringify(blocks));
    }
  } catch (error) {
    console.error(`Error sending blocks to database: ${error.message}`);
    world.setDynamicProperty("pendingBlock", JSON.stringify(blocks));
  }
};

/**
 * Creates data for a mined block.
 * @param {Object} player - The player who mined the block.
 * @param {string} blockName - The name of the block.
 * @param {Object} location - The block's location.
 * @returns {Object} - The block data.
 */
export const createBlockData = (player, blockName, location) => {
  const minecraftId = getPlayerData(player).xuid;
  return {
    hash: generateRandomString(),
    minecraft_id: minecraftId,
    block: blockName.replace("matscraft:", ""),
    location: {
      x: location.x,
      y: location.y,
      z: location.z,
    },
    mined_at: new Date().toISOString().replace(/Z$/, "+00:00"),
  };
};

/**
 * Handles item drops based on pickaxe ability.
 * @param {Object} player - The player.
 * @param {string} blockName - The name of the block.
 * @param {string} pickaxeTypeId - The pickaxe type ID.
 * @param {Object} location - The block's location.
 * @param {Object} dimension - The dimension where the block is located.
 */
export const handleItemDrops = async (player, blockName, pickaxeTypeId, location, dimension) => {
  const playerData = getPlayerData(player);
  if (!playerData.data.is_linked) {
    console.log(`Player ${player.name} is not linked`);
    return;
  }

  const result = pickAxeAbility.find((ability) => ability.typeId === pickaxeTypeId);
  const allowedBlocks = result?.allowed || [];

  if (!allowedBlocks.includes(blockName)) {
    try {
      dimension.runCommand(
        `kill @e[type=item,x=${location.x},y=${location.y},z=${location.z},r=2]`
      );
    } catch (error) {
      console.error(`Failed to remove item drop: ${error.message}`);
    }
  }
};

/**
 * Stores a mined block to the pending list.
 * @param {Object} blockData - The mined block data.
 */
export const storeMinedBlock = async (blockData) => {
  await savePendingBlock(blockData);
};