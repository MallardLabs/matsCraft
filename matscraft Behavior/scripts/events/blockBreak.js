import { world } from "@minecraft/server";
import { config } from "../config";
import { httpReq } from "../lib/httpReq";
import { pickAxeAbility } from "../logic/pickaxeAbility.js";
world.afterEvents.playerBreakBlock.subscribe(async (event) => {
  const {
    player,
    brokenBlockPermutation: { type: block },
    block: { location, dimension },
    itemStackAfterBreak: { typeId },
  } = event;
  const blockName = block.id;
  const PickAxe = typeId;
  await itemDrops(player, blockName, PickAxe, location, dimension);
});

const itemDrops = async (player, blockName, PickAxe, location, dimension) => {
  const playerData = JSON.parse(player.getDynamicProperty("playerData"));
  if (!playerData.data.is_linked) {
    return;
  }

  //Check The Pickaxe Ability
  const result = pickAxeAbility.find((ability) => ability.typeId === PickAxe);
  const allowedBlocks = result.allowed;

  // If Block Not In Allowed List, Remove Item From World
  if (!allowedBlocks.includes(blockName)) {
    dimension.runCommand(
      `kill @e[type=item,x=${location.x},y=${location.y},z=${location.z},r=2]`
    );
  }
};

const addBlocks = async () => {
  const blocks = await httpReq.request({
    method: "GET",
    url: `${config.ENDPOINTS.BLOCKS}`,
  });
  const parsedBlocks = JSON.parse(blocks.body);
  const blockList = parsedBlocks.map((block) => block.id);
  return blockList;
};
