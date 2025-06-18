import { world, Block, Player, Dimension, ItemStack } from "@minecraft/server";

type BlockBreakData = {
  player: Player;
  blockId: string;
  location: Block["location"];
  dimension: Dimension;
  toolTypeId?: string;
};
type DropItemEntry = {
  id: string;
  min: number;
  max: number;
};
type BlockBreakActions = {
  restore(): void;
  dropItem(entry: DropItemEntry[]): void;
  removeDropItem(): void;
};

type BlockBreakCallback = (
  data: BlockBreakData,
  actions: BlockBreakActions
) => void;

class BlockBreak {
  private listeners: BlockBreakCallback[] = [];

  constructor() {
    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
    world.afterEvents.playerBreakBlock.subscribe(
      this.handleBlockBreak.bind(this)
    );
  }

  private handleBlockBreak(event: any): void {
    const {
      player,
      brokenBlockPermutation: { type: block },
      block: { location, dimension },
      itemStackAfterBreak,
    } = event;

    const data: BlockBreakData = {
      player,
      blockId: block.id,
      location,
      dimension,
      toolTypeId: itemStackAfterBreak?.typeId,
    };

    const actions: BlockBreakActions = {
      restore() {
        try {
          dimension.runCommand(
            `setblock ${location.x} ${location.y} ${location.z} ${data.blockId}`
          );
        } catch (error: any) {
          console.error(`Failed to restore block: ${error.message}`);
        }
      },
      removeDropItem() {
        try {
          world
            .getDimension("overworld")
            .runCommand(
              `kill @e[type=item,x=${location.x},y=${location.y},z=${location.z},r=2]`
            );
        } catch (error: any) {
          console.error(`Failed to remove dropped items: ${error.message}`);
        }
      },
      dropItem(entry) {
        const item = entry[Math.floor(Math.random() * entry.length)];
        const low = Math.min(item.min, item.max);
        const high = Math.max(item.min, item.max);
        const amount = Math.floor(Math.random() * (high - low + 1)) + low;
        const selectedItem = new ItemStack(item.id, amount);
        dimension.spawnItem(selectedItem, location);
      },
    };

    for (const listener of this.listeners) {
      listener(data, actions);
    }
  }

  public listen(callback: BlockBreakCallback): void {
    if (typeof callback !== "function") {
      throw new Error("Callback must be a function");
    }
    this.listeners.push(callback);
  }
}

const blockBreak = new BlockBreak();
export default blockBreak;
