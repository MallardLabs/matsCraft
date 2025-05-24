import { world } from "@minecraft/server";
const worldGetData = (name) => {
    return world.getDynamicProperty(`${name}`);
};
const worldSetData = (name, value) => {
    world.setDynamicProperty(`${name}`, value);
};
export { worldGetData, worldSetData };
