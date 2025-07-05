import { world, ItemStack } from "@minecraft/server";
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
     * Creates a new BlockBreak instance and automatically subscribes to block break events.
     *
     * @example
     * ```typescript
     * const blockBreak = new BlockBreak();
     * ```
     */
    constructor() {
        /**
         * Array of registered callback functions that will be called on block break events.
         * @private
         */
        this.listeners = [];
        this.subscribeToEvents();
    }
    /**
     * Subscribes to the Minecraft block break event system.
     * This method is called automatically during construction.
     *
     * @private
     */
    subscribeToEvents() {
        world.afterEvents.playerBreakBlock.subscribe(this.handleBlockBreak.bind(this));
    }
    /**
     * Handles incoming block break events and notifies all registered listeners.
     *
     * @param event - The raw block break event from Minecraft's event system
     * @private
     */
    handleBlockBreak(event) {
        const { player, brokenBlockPermutation: { type: block }, block: { location, dimension }, itemStackAfterBreak, } = event;
        const data = {
            player,
            blockId: block.id,
            location,
            dimension,
            toolTypeId: itemStackAfterBreak?.typeId,
        };
        const actions = {
            restore() {
                try {
                    dimension.runCommand(`setblock ${location.x} ${location.y} ${location.z} ${data.blockId}`);
                }
                catch (error) {
                    console.error(`Failed to restore block: ${error.message}`);
                }
            },
            removeDropItem() {
                try {
                    world
                        .getDimension("overworld")
                        .runCommand(`kill @e[type=item,x=${location.x},y=${location.y},z=${location.z},r=2]`);
                }
                catch (error) {
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
    listen(callback) {
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
    removeListener(callback) {
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
    clearListeners() {
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
    getListenerCount() {
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
