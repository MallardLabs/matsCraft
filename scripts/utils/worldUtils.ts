import { world } from "@minecraft/server";

const worldGetData = (name: string) => {
  return world.getDynamicProperty(`${name}`);
};
const worldSetData = (name: string, value: string) => {
  world.setDynamicProperty(`${name}`, value);
};

export { worldGetData, worldSetData };
