import { world, ItemStack } from "@minecraft/server";
class BlockBreak {
    constructor() {
        this.listeners = [];
        this.subscribeToEvents();
    }
    subscribeToEvents() {
        world.afterEvents.playerBreakBlock.subscribe(this.handleBlockBreak.bind(this));
    }
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
    listen(callback) {
        if (typeof callback !== "function") {
            throw new Error("Callback must be a function");
        }
        this.listeners.push(callback);
    }
}
const blockBreak = new BlockBreak();
export default blockBreak;
