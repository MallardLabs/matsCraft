import { system } from "@minecraft/server";
import { Command } from "./customCommand";
import "./scoreboard";
import "./group";
import "./tpa";
Command.createCommand("help", "user", "Show all available commands", (sender, args) => {
    system.run(() => {
        Command.listCommands(sender);
    });
});
Command.registerListener();
