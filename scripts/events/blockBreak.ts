import { world, Block, Player, Dimension } from "@minecraft/server";

type BlockBreakData = {
  player: Player;
  blockId: string;
  location: Block["location"];
  dimension: Dimension;
  toolTypeId?: string;
};

type BlockBreakActions = {

  restore(): void;


  removeDropItem(): void;
};

type BlockBreakCallback = (data: BlockBreakData, actions: BlockBreakActions) => void;

class BlockBreak {
  private listeners: BlockBreakCallback[] = [];

  constructor() {
    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
    world.afterEvents.playerBreakBlock.subscribe(this.handleBlockBreak.bind(this));
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
          dimension.runCommand(
            `kill @e[type=item,x=${location.x},y=${location.y},z=${location.z},r=2]`
          );
        } catch (error: any) {
          console.error(`Failed to remove dropped items: ${error.message}`);
        }
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
