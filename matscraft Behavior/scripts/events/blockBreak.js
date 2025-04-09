import { world } from "@minecraft/server";
import { config } from "../config";
import { httpReq } from "../lib/httpReq";
export class BlockBreakEvent {
  constructor() {
    this.logBatch = []; // The batch of logs block break
    this.batchSize = 1; // The maximum number of logs to send in a single request
  }

  initialize() {
    world.afterEvents.playerBreakBlock.subscribe((event) =>
      this.handleBlockBreak(event)
    );
  }

  handleBlockBreak = (event) => {
    const {
      player,
      brokenBlockPermutation: { type: block },
      block: { location: position },
    } = event;
    const blockName = block.id;
    this.logBlockBreak(player, blockName, position);
  };

  // Function to log the block break
  logBlockBreak = (player, blockName, position) => {
    const playerData = JSON.parse(player.getDynamicProperty("playerData")); // Get the player's data
    if (!playerData.data.is_linked) return; // Check if the player is linked
    if (!blockName.includes("matscraft")) return; // Check if the block is a matscraft block

    const data = {
      minecraft_id: playerData.xuid,
      block: blockName.replace("matscraft:", ""),
      position: {
        x: position.x,
        y: position.y,
        z: position.z,
      },
      mined_at: new Date().toISOString(),
    };

    this.logBatch.push(data);
    this.notifyPlayer(player, blockName, position);
    if (this.logBatch.length >= this.batchSize) {
      console.warn("Batch full, sending to database...");
      this.sendBatch();
    }
  };

  // Function to send the batch from the logs
  sendBatch = async () => {
    try {
      const response = await httpReq.request({
        method: "POST",
        url: `${config.BASE_URL}/api/matscraft/blocks`,
        body: this.logBatch,
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.logBatch = [];
      console.info(response.body);
    } catch (error) {
      console.error("Error sending batch:", error);
    }
  };

  // For Debuging
  notifyPlayer = (player, blockName, position) => {
    if (!blockName.includes("matscraft")) {
      return;
    }

    player.runCommand(
      `title @s actionbar §aYou broke ${blockName.replace(
        "matscraft:",
        ""
      )} at ${position.x.toFixed(1)}, ${position.y.toFixed(
        1
      )}, ${position.z.toFixed(1)}!`
    );
  };
}
