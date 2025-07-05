import { world, Block, Player, Dimension, ItemStack } from "@minecraft/server";

/**
 * Data structure containing information about a block break event.
 */
type BlockBreakData = {
  /** The player who broke the block */
  player: Player;
  /** The ID of the broken block (e.g., "minecraft:stone") */
  blockId: string;
  /** The location coordinates where the block was broken */
  location: Block["location"];
  /** The dimension where the block was broken */
  dimension: Dimension;
  /** The type ID of the tool used to break the block (optional) */
  toolTypeId?: string;
};

/**
 * Configuration for dropping items with randomized quantities.
 */
type DropItemEntry = {
  /** The item ID to drop (e.g., "minecraft:diamond") */
  id: string;
  /** Minimum quantity to drop */
  min: number;
  /** Maximum quantity to drop */
  max: number;
};

/**
 * Actions that can be performed in response to a block break event.
 */
type BlockBreakActions = {
  /**
   * Restores the broken block to its original state.
   *
   * @throws {Error} If the block cannot be restored (e.g., invalid location or block ID)
   *
   * @example
   * ```typescript
   * blockBreak.listen((data, actions) => {
   *   if (data.blockId === "minecraft:bedrock") {
   *     actions.restore(); // Prevent bedrock from being broken
   *   }
   * });
   * ```
   */
  restore(): void;

  /**
   * Drops custom items at the block's location with randomized quantities.
   * Randomly selects one entry from the provided array and drops the specified item.
   *
   * @param entry - Array of possible items to drop with their quantity ranges
   *
   * @throws {Error} If item spawning fails (e.g., invalid item ID or location)
   *
   * @example
   * ```typescript
   * // Drop 1-3 diamonds or 2-5 emeralds randomly
   * actions.dropItem([
   *   { id: "minecraft:diamond", min: 1, max: 3 },
   *   { id: "minecraft:emerald", min: 2, max: 5 }
   * ]);
   * ```
   */
  dropItem(entry: DropItemEntry[]): void;

  /**
   * Removes all dropped items in a 2-block radius from the broken block's location.
   * Useful for preventing default drops when implementing custom drop logic.
   *
   * @throws {Error} If the command execution fails
   *
   * @example
   * ```typescript
   * blockBreak.listen((data, actions) => {
   *   if (data.blockId === "minecraft:diamond_ore") {
   *     actions.removeDropItem(); // Remove default diamond drop
   *     actions.dropItem([{ id: "minecraft:diamond", min: 2, max: 4 }]); // Custom drop
   *   }
   * });
   * ```
   */
  removeDropItem(): void;
};

/**
 * Callback function type for handling block break events.
 *
 * @param data - Information about the block break event
 * @param actions - Available actions to perform in response to the event
 */
type BlockBreakCallback = (
  data: BlockBreakData,
  actions: BlockBreakActions
) => void;

/**
 * A comprehensive block break event manager for Minecraft Bedrock Edition.
 *
 * This class provides a powerful and flexible way to handle block break events,
 * allowing you to customize block breaking behavior, implement custom drops,
 * prevent certain blocks from being broken, and much more.
 *
 * @example
 * ```typescript
 * import blockBreak from './block-break';
 *
 * // Prevent bedrock from being broken
 * blockBreak.listen((data, actions) => {
 *   if (data.blockId === "minecraft:bedrock") {
 *     actions.restore();
 *     data.player.sendMessage("§cBedrock cannot be broken!");
 *   }
 * });
 *
 * // Custom ore drops based on tool
 * blockBreak.listen((data, actions) => {
 *   if (data.blockId === "minecraft:diamond_ore") {
 *     actions.removeDropItem(); // Remove default drops
 *
 *     if (data.toolTypeId === "minecraft:diamond_pickaxe") {
 *       actions.dropItem([{ id: "minecraft:diamond", min: 2, max: 4 }]);
 *     } else {
 *       actions.dropItem([{ id: "minecraft:diamond", min: 1, max: 2 }]);
 *     }
 *   }
 * });
 * ```
 */
class BlockBreak {
  /**
   * Array of registered callback functions that will be called on block break events.
   * @private
   */
  private listeners: BlockBreakCallback[] = [];

  /**
   * Creates a new BlockBreak instance and automatically subscribes to block break events.
   *
   * @example
   * ```typescript
   * const blockBreak = new BlockBreak();
   * ```
   */
  constructor() {
    this.subscribeToEvents();
  }

  /**
   * Subscribes to the Minecraft block break event system.
   * This method is called automatically during construction.
   *
   * @private
   */
  private subscribeToEvents(): void {
    world.afterEvents.playerBreakBlock.subscribe(
      this.handleBlockBreak.bind(this)
    );
  }

  /**
   * Handles incoming block break events and notifies all registered listeners.
   *
   * @param event - The raw block break event from Minecraft's event system
   * @private
   */
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

  /**
   * Registers a callback function to be called whenever a player breaks a block.
   *
   * Multiple listeners can be registered, and they will all be called in the order
   * they were registered. Each listener receives the same data and actions objects,
   * so be careful about conflicting actions (e.g., one listener restoring a block
   * while another tries to drop items).
   *
   * @param callback - Function to call when a block is broken. The callback receives
   *   two parameters: `data` (information about the break event) and `actions`
   *   (methods to respond to the event).
   *
   * @throws {Error} If the callback parameter is not a function
   *
   * @example
   * ```typescript
   * // Basic usage - prevent specific blocks from being broken
   * blockBreak.listen((data, actions) => {
   *   if (data.blockId === "minecraft:obsidian") {
   *     actions.restore();
   *     data.player.sendMessage("§cObsidian is protected!");
   *   }
   * });
   *
   * // Advanced usage - custom drops based on conditions
   * blockBreak.listen((data, actions) => {
   *   const { player, blockId, location, toolTypeId } = data;
   *
   *   // Custom coal ore behavior
   *   if (blockId === "minecraft:coal_ore") {
   *     actions.removeDropItem(); // Remove default coal drop
   *
   *     // Better drops with fortune pickaxe
   *     if (toolTypeId?.includes("diamond_pickaxe")) {
   *       actions.dropItem([
   *         { id: "minecraft:coal", min: 2, max: 4 },
   *         { id: "minecraft:diamond", min: 0, max: 1 } // Rare bonus
   *       ]);
   *     } else {
   *       actions.dropItem([{ id: "minecraft:coal", min: 1, max: 2 }]);
   *     }
   *
   *     player.sendMessage(`§aMined coal ore at ${location.x}, ${location.y}, ${location.z}`);
   *   }
   * });
   *
   * // Tool durability system
   * blockBreak.listen((data, actions) => {
   *   if (data.toolTypeId === "minecraft:wooden_pickaxe") {
   *     // 10% chance to break wooden pickaxe
   *     if (Math.random() < 0.1) {
   *       data.player.sendMessage("§cYour wooden pickaxe broke!");
   *       // Additional logic to remove tool from inventory
   *     }
   *   }
   * });
   *
   * // Area protection system
   * blockBreak.listen((data, actions) => {
   *   const { location, player } = data;
   *
   *   // Protect spawn area (example coordinates)
   *   if (Math.abs(location.x) < 50 && Math.abs(location.z) < 50) {
   *     actions.restore();
   *     player.sendMessage("§cYou cannot break blocks in the spawn area!");
   *   }
   * });
   * ```
   */
  public listen(callback: BlockBreakCallback): void {
    if (typeof callback !== "function") {
      throw new Error("Callback must be a function");
    }
    this.listeners.push(callback);
  }

  /**
   * Removes a previously registered callback function.
   *
   * @param callback - The callback function to remove
   * @returns {boolean} True if the callback was found and removed, false otherwise
   *
   * @example
   * ```typescript
   * const myCallback = (data, actions) => {
   *   // Some logic here
   * };
   *
   * blockBreak.listen(myCallback);
   * // Later...
   * const removed = blockBreak.removeListener(myCallback);
   * console.log(removed); // true if successfully removed
   * ```
   */
  public removeListener(callback: BlockBreakCallback): boolean {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Removes all registered callback functions.
   *
   * @example
   * ```typescript
   * blockBreak.clearListeners();
   * console.log("All block break listeners removed");
   * ```
   */
  public clearListeners(): void {
    this.listeners = [];
  }

  /**
   * Returns the number of currently registered listeners.
   *
   * @returns {number} The number of registered callback functions
   *
   * @example
   * ```typescript
   * console.log(`Currently have ${blockBreak.getListenerCount()} block break listeners`);
   * ```
   */
  public getListenerCount(): number {
    return this.listeners.length;
  }
}

/**
 * Default instance of the BlockBreak class.
 *
 * This is the recommended way to use the block break system. Import this
 * instance and use it throughout your addon to maintain consistency.
 *
 * @example
 * ```typescript
 * import blockBreak from './block-break';
 *
 * // Use the default instance
 * blockBreak.listen((data, actions) => {
 *   // Your block break logic here
 * });
 * ```
 */
const blockBreak = new BlockBreak();

export default blockBreak;
