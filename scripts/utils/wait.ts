import { system } from "@minecraft/server";

export default function wait(ms: number): Promise<void> {
  return new Promise<void>((resolve) => system.runTimeout(() => resolve(), ms));
}
