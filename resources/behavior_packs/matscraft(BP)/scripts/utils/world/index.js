import { system, world } from "@minecraft/server";
export const getWorldData = (name) => {
    return world.getDynamicProperty(name);
};
export const setWorldData = (name, value) => {
    system.run(() => world.setDynamicProperty(name, value));
};
