import { Player, system } from "@minecraft/server";
import { Command } from "./customCommand";
import { send } from "process";

Command.createCommand("score:hide", "user", "Hide Scoreboard", (sender: Player, args: string[]) => {
   system.run(() => {
      sender.addTag("hide-scoreboard");
      sender.runCommand("title @s clear");
      sender.sendMessage("§aScoreboard hidden!");
   });
});
Command.createCommand("score:show", "user", "Show Scoreboard", (sender: Player, args: string[]) => {
   system.run(() => {
      sender.removeTag("hide-scoreboard");
      sender.sendMessage("§aScoreboard shown!");
   });
});
