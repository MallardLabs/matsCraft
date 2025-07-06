import { world } from "@minecraft/server";
world.beforeEvents.chatSend.subscribe((data) => {
    if (data.message.startsWith("!scoreboard-show")) {
        data.cancel = true;
    }
});
