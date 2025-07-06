import { system } from "@minecraft/server";
import { Command } from "./customCommand";
Command.createCommand("score:hide", "user", "Hide Scoreboard", (sender, args) => {
    system.run(() => {
        sender.addTag("hide-scoreboard");
        sender.runCommand("title @s clear");
        sender.sendMessage("§aScoreboard hidden!");
    });
});
Command.createCommand("score:show", "user", "Show Scoreboard", (sender, args) => {
    system.run(() => {
        sender.removeTag("hide-scoreboard");
        sender.sendMessage("§aScoreboard shown!");
    });
});
