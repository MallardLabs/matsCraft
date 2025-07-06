import { world, Player, system } from "@minecraft/server";

type CommandData = {
   command: string;
   permission: "admin" | "user";
   description: string;
   callback: (sender: Player, args: string[]) => void;
};

export class Command {
   private static readonly PREFIX = "!";
   private static commands: CommandData[] = [];

   // Tambah deskripsi ke parameter
   public static createCommand(
      command: string,
      permission: "admin" | "user",
      description: string,
      callback: (sender: Player, args: string[]) => void
   ) {
      this.commands.push({ command, permission, description, callback });
   }

   public static registerListener() {
      world.beforeEvents.chatSend.subscribe((data) => {
         const message = data.message.trim();
         if (!message.startsWith(this.PREFIX)) return;

         const args = message.slice(this.PREFIX.length).split(" ");
         const commandName = args.shift()?.toLowerCase();
         const sender = data.sender;

         if (!commandName) return;

         const found = this.commands.find((cmd) => cmd.command === commandName);

         if (!found) {
            data.cancel = true;
            this.showInvalidCommandMessage(sender, commandName);
            return;
         }

         if (found.permission === "admin" && !sender.hasTag("admin")) {
            data.cancel = true;
            sender.sendMessage("§cYou don't have permission to run this command.");
            return;
         }

         data.cancel = true;
         found.callback(sender, args);
      });
   }

   public static showInvalidCommandMessage(sender: Player, commandName: string) {
      sender.sendMessage(`§cCommand "${this.PREFIX}${commandName}" not found!`);
   }

   // Bonus: untuk command !help
   public static listCommands(sender: Player) {
      const isAdmin = sender.hasTag("admin");

      const filteredCommands = this.commands.filter((cmd) => cmd.permission === "user" || isAdmin);

      const categorized: Record<string, CommandData[]> = {};

      for (const cmd of filteredCommands) {
         const prefix = cmd.command.includes(":") ? cmd.command.split(":")[0] : "other";
         if (!categorized[prefix]) categorized[prefix] = [];
         categorized[prefix].push(cmd);
      }

      for (const [category, commands] of Object.entries(categorized)) {
         const title =
            category === "other"
               ? "Other Commands"
               : `${category[0].toUpperCase()}${category.slice(1)} Commands`;

         sender.sendMessage(`§6${title}:`);
         for (const cmd of commands) {
            sender.sendMessage(`  - §a!${cmd.command} §7- ${cmd.description}`);
         }
         sender.sendMessage(""); // spacer
      }
   }
}
