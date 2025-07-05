import { world } from "@minecraft/server";

export const getWorldData = (name: string) => {
  return world.getDynamicProperty(name);
};
