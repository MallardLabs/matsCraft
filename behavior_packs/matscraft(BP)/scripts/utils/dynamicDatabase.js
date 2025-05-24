import { world } from "@minecraft/server";
const worldGetData = (name) => {
    return world.getDynamicProperty(`${name}`);
};
const worldSetData = (name, value) => {
    world.setDynamicProperty(`${name}`, value);
};
const playerGetData = (player, name) => {
    return player.getDynamicProperty(`${name}`)
        ? JSON.parse(player.getDynamicProperty(`${name}`))
        : null;
};
const playerSetData = (player, name, value) => {
    player.setDynamicProperty(`${name}`, value);
};
export { worldGetData, worldSetData, playerGetData, playerSetData };
