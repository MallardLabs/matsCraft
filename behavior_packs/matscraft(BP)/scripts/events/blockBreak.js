import { world } from "@minecraft/server";
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
                    dimension.runCommand(`kill @e[type=item,x=${location.x},y=${location.y},z=${location.z},r=2]`);
                }
                catch (error) {
                    console.error(`Failed to remove dropped items: ${error.message}`);
                }
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
