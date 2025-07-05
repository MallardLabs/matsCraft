import { world } from "@minecraft/server";
export const getWorldData = (name) => {
    return world.getDynamicProperty(name);
};
