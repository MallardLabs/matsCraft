import { Dimension, Player, Block, world, system } from "@minecraft/server";
import { variables } from "@minecraft/server-admin";
import blockBreak from "../event/BlockBreak";
import logger from "../utils/logger";
import { getPlayerData, showActionBar } from "../utils/player/index";
import generateRandomString from "../utils/genRandomStr";
import { httpReq } from "../lib/httpReq";
import genSecret from "../lib/genSecret";
import { pickAxeAbility } from "../config/pickaxe/index";
import ore_config from "../config/ore/index";

interface BlockLocation {
  x: number;
  y: number;
  z: number;
}

interface MinedBlockData {
  hash: string;
  minecraft_id: string;
  block_name: string;
  location: BlockLocation;
  pickaxe: string;
  mined_at: string;
}

class BlockManager {
  private static readonly MAX_PENDING_BLOCKS = 10;
  private static readonly MATSCRAFT_PREFIX = "matscraft:";

  static handleBlockBreak(data: any, actions: any): void {
    const { player, blockId, location, toolTypeId, dimension } = data;

    if (
      !this.isValidBlock(blockId, toolTypeId) ||
      !this.checkHeightRestriction(dimension, location, player)
    ) {
      return;
    }

    const playerData = getPlayerData(player);
    if (!this.canPlayerMine(player, playerData)) {
      this.handleUnauthorizedMining(actions, player);
      return;
    }

    const pickAxe = this.getValidPickaxe(toolTypeId, blockId);
    if (!pickAxe) {
      actions.removeDropItem();
      return;
    }

    this.processBlockBreak(blockId, location, player, toolTypeId, actions);
  }

  private static isValidBlock(blockId: string, toolTypeId?: string) {
    return (
      blockId.includes(this.MATSCRAFT_PREFIX) &&
      toolTypeId?.includes(this.MATSCRAFT_PREFIX)
    );
  }

  private static checkHeightRestriction(
    dimension: Dimension,
    location: BlockLocation,
    player: Player
  ): boolean {
    return (
      !(dimension.id.includes("overworld") && location.y >= 172) ||
      player.hasTag("admin") ||
      player.hasTag("builder")
    );
  }

  private static canPlayerMine(player: Player, playerData: any): boolean {
    return (
      (playerData?.data.is_linked || player.hasTag("admin")) &&
      !player.hasTag("banned")
    );
  }

  private static handleUnauthorizedMining(actions: any, player: Player): void {
    actions.restore();
    actions.removeDropItem();
    if (player.hasTag("banned")) {
      showActionBar(player, "§cYou're on ban list! You can't mine matsblocks!");
      console.warn(`⚠️ Banned player ${player.nameTag} tried to mine blocks`);
    }
  }

  private static getValidPickaxe(toolTypeId: string, blockId: string) {
    const pickAxe = pickAxeAbility.find((p) => p.typeId === toolTypeId);
    return pickAxe?.allowed.includes(blockId) ? pickAxe : null;
  }

  private static processBlockBreak(
    blockId: string,
    location: BlockLocation,
    player: Player,
    toolTypeId: string,
    actions: any
  ): void {
    const xuid = player.getDynamicProperty("xuid") as string;
    const drop =
      ore_config[
        blockId.replace(this.MATSCRAFT_PREFIX, "") as keyof typeof ore_config
      ];

    actions.dropItem(drop);
    this.storePendingBlock(blockId, location, xuid, toolTypeId);
  }

  static storePendingBlock(
    blockId: string,
    location: BlockLocation,
    xuid: string,
    toolTypeId?: string
  ): void {
    system.run(() => {
      const worldData = this.getPendingBlocks();
      const newData = this.createBlockData(xuid, blockId, location, toolTypeId);

      worldData.push(newData);
      world.setDynamicProperty("pendingBlock", JSON.stringify(worldData));

      if (worldData.length >= this.MAX_PENDING_BLOCKS) {
        this.updateBlocks();
      }
    });
  }

  private static getPendingBlocks(): MinedBlockData[] {
    const rawData = world.getDynamicProperty("pendingBlock") as string;
    return rawData ? JSON.parse(rawData) : [];
  }

  private static createBlockData(
    xuid: string,
    blockId: string,
    location: BlockLocation,
    toolTypeId?: string
  ): MinedBlockData {
    return {
      hash: generateRandomString(),
      minecraft_id: xuid,
      block_name: blockId.replace(this.MATSCRAFT_PREFIX, ""),
      location: { x: location.x, y: location.y, z: location.z },
      pickaxe: toolTypeId?.replace(this.MATSCRAFT_PREFIX, "") || "",
      mined_at: new Date().toISOString(),
    };
  }

  private static async updateBlocks(): Promise<void> {
    system.run(async () => {
      const rawData = world.getDynamicProperty("pendingBlock") as string;
      const response = await this.sendBlocksToServer(rawData);

      if (response.status === 200) {
        world.setDynamicProperty("pendingBlock", JSON.stringify([]));
        logger.info("onBlockBreak", "Successfully saved blocks to database");
      } else {
        console.error(
          `Failed to save blocks: ${response.status} - ${response.body}`
        );
      }
    });
  }

  private static async sendBlocksToServer(data: string) {
    return await httpReq({
      method: "post",
      url: `${variables.get("BASE_URL")}/users/blocks`,
      data,
      headers: {
        "Content-Type": "application/json",
        "matscraft-secret": genSecret(),
      },
    });
  }
}

blockBreak.listen(BlockManager.handleBlockBreak.bind(BlockManager));
