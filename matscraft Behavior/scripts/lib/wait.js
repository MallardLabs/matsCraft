import { system } from "@minecraft/server";

export function wait(ms) {
  return new Promise((resolve) => system.runTimeout(() => resolve(), ms));
}
