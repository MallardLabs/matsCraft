import { system } from "@minecraft/server";
export default function wait(ms) {
    return new Promise((resolve) => system.runTimeout(() => resolve(), ms));
}
