import { system, world } from "@minecraft/server";
import wait from "../wait";

export const getWorldData = (name: string) => {
   return world.getDynamicProperty(name);
};
export const setWorldData = (name: string, value: any) => {
   system.run(() => world.setDynamicProperty(name, value));
};
