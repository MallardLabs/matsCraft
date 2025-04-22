import { world } from "@minecraft/server";
import { pickAxeAbility } from "../logic/pickaxeAbility.js";
import { getPlayerData } from "../utils/playerUtils.js";
import { generateRandomString } from "../utils/genRandomStr.js";
import { ENDPOINTS } from "../config/endpoints.js";
import { httpReq } from "../lib/httpReq.js";

world.afterEvents.playerBreakBlock.subscribe(async (event) => {
  const {
    player,
    brokenBlockPermutation: { type: block },
    block: { location, dimension },
    itemStackAfterBreak: { typeId },
  } = event;

  const blockName = block.id;
  const playerData = getPlayerData(player);
  const pickAxeType = typeId
  console.log(blockName)
  if (!blockName.includes("matscraft")) return;

  await handleItemDrops(player, blockName, pickAxeType, location, dimension);

  const blockData = createBlockData(playerData.xuid, blockName, location);
  await storePendingBlock(blockData);
});

const handleItemDrops = async (
  player,
  blockName,
  pickAxeType,
  location,
  dimension
) => {
  const rawData = player.getDynamicProperty("playerData");
  if (!rawData) return;

  const { data } = JSON.parse(rawData);
  if (!data?.is_linked) return;

  const pickaxe = pickAxeAbility.find(
    (ability) => ability.typeId === pickAxeType
  );
  const allowedBlocks = pickaxe?.allowed || [];

  if (!allowedBlocks.includes(blockName)) {
    dimension.runCommand(
      `kill @e[type=item,x=${location.x},y=${location.y},z=${location.z},r=2]`
    );
  }
};

const createBlockData = (xuid, blockName, location) => {
  return {
    hash: generateRandomString(),
    minecraft_id: xuid,
    block: blockName.replace("matscraft:", ""),
    location: {
      x: location.x,
      y: location.y,
      z: location.z,
    },
    mined_at: new Date().toISOString(),
  }
};

const storePendingBlock = async (data) => {
  let blockData = world.getDynamicProperty("pendingBlock");
  let parsed = [];

  try {
    parsed = blockData ? JSON.parse(blockData) : [];
  } catch (err) {
    console.error("Failed to parse pendingBlock:", err);
  }

  parsed.push(data);
  console.log(parsed.length)
  if (parsed.length >= 10) {
    await updateBlock(parsed); // POST to database
  } else {
    world.setDynamicProperty("pendingBlock", JSON.stringify(parsed)); // Update local store
  }
};


const updateBlock = async (data) => {
  try {
    const response = await httpReq.request({
      method: "POST",
      url: ENDPOINTS.INSERT_BLOCK,
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 200) {
      console.log("Successfully saved blocks to database");

      // Reset Pending Blocks
      world.setDynamicProperty("pendingBlock", JSON.stringify([]));
    } else {
      console.error(`Failed to save blocks: ${response.status} - ${response.body}`);
      // Save back to pending if failed
      world.setDynamicProperty("pendingBlock", JSON.stringify(data));
    }
  } catch (error) {
    console.error(`Error sending blocks to database: ${error.message}`);
    world.setDynamicProperty("pendingBlock", JSON.stringify(data));
  }
};
