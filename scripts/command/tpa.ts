import { world, Player, system, ScriptEventCommandMessageAfterEvent } from "@minecraft/server";
import { Command } from "./customCommand";

/**
 * Represents a teleport request between players
 */
type TeleportRequest = {
   requester: string; // Player who wants to teleport
   target: string; // Player who will receive the teleport request
   timestamp: number; // When the request was made
   expires: number; // When the request expires
};

/**
 * Main TPA (Teleport Request) class that handles all teleport request operations
 */
class TPA {
   // Dynamic property key for storing teleport requests
   private static readonly TPA_DATA_KEY = "tpaRequests";

   // Request expiration time in milliseconds (60 seconds)
   private static readonly REQUEST_TIMEOUT = 60000;

   // Maximum number of pending requests per player
   private static readonly MAX_PENDING_REQUESTS = 5;

   /**
    * Main entry point for handling TPA-related script events
    * @param event - The script event that triggered this handler
    */
   static initialize(event: ScriptEventCommandMessageAfterEvent): void {
      if (!event.id.includes("tpa:")) return;

      const action = event.id.split("tpa:")[1];
      const args = event.message.replace(/<|>/g, "").trim();
      const sender = event.sourceEntity as Player;

      switch (action) {
         case "request":
            this.sendTeleportRequest(sender, args);
            break;
         case "accept":
            this.acceptTeleportRequest(sender, args);
            break;
         case "deny":
            this.denyTeleportRequest(sender, args);
            break;
         case "cancel":
            this.cancelTeleportRequest(sender, args);
            break;
         case "list":
            this.listPendingRequests(sender);
            break;
      }
   }

   /**
    * Sends a teleport request from sender to target player
    * @param sender - The player requesting to teleport
    * @param targetName - Name of the player to teleport to
    */
   private static sendTeleportRequest(sender: Player, targetName: string): void {
      if (!targetName) {
         sender.sendMessage("§cUsage: !tpa <playerName>");
         return;
      }

      // Find target player
      const targetPlayer = this.findPlayerByName(targetName);
      if (!targetPlayer) {
         sender.sendMessage(`§cPlayer "${targetName}" not found or not online.`);
         return;
      }

      // Check if trying to teleport to themselves
      if (targetPlayer.name === sender.name) {
         sender.sendMessage("§cYou cannot teleport to yourself.");
         return;
      }

      // Clean up expired requests first
      this.cleanupExpiredRequests();

      const requests = this.getTeleportRequests();

      // Check if there's already a pending request to this player
      const existingRequest = requests.find(
         (req) => req.requester === sender.name && req.target === targetPlayer.name
      );

      if (existingRequest) {
         sender.sendMessage(
            `§cYou already have a pending teleport request to ${targetPlayer.name}.`
         );
         return;
      }

      // Check if sender has too many pending requests
      const senderRequests = requests.filter((req) => req.requester === sender.name);
      if (senderRequests.length >= this.MAX_PENDING_REQUESTS) {
         sender.sendMessage(
            `§cYou have too many pending teleport requests. Maximum: ${this.MAX_PENDING_REQUESTS}`
         );
         return;
      }

      // Create new teleport request
      const newRequest: TeleportRequest = {
         requester: sender.name,
         target: targetPlayer.name,
         timestamp: Date.now(),
         expires: Date.now() + this.REQUEST_TIMEOUT,
      };

      requests.push(newRequest);
      this.saveTeleportRequests(requests);

      // Send messages to both players
      sender.sendMessage(
         `§aTeleport request sent to ${targetPlayer.name}. Request expires in 60 seconds.`
      );

      targetPlayer.sendMessage(
         `§e${sender.name} wants to teleport to your location.\n` +
            `§7Use §a!tpa:accept ${sender.name} §7to accept or §c!tpa:deny ${sender.name} §7to deny.\n` +
            `§7Request expires in 60 seconds.`
      );
   }

   /**
    * Accepts a teleport request from another player
    * @param sender - The player accepting the request
    * @param requesterName - Name of the player who made the request
    */
   private static acceptTeleportRequest(sender: Player, requesterName: string): void {
      if (!requesterName) {
         sender.sendMessage("§cUsage: !tpa:accept <playerName>");
         return;
      }

      // Clean up expired requests first
      this.cleanupExpiredRequests();

      const requests = this.getTeleportRequests();

      // Find the specific request
      const requestIndex = requests.findIndex(
         (req) =>
            req.requester.toLowerCase() === requesterName.toLowerCase() &&
            req.target === sender.name
      );

      if (requestIndex === -1) {
         sender.sendMessage(`§cNo pending teleport request from "${requesterName}".`);
         return;
      }

      const request = requests[requestIndex];

      // Find the requester player
      const requesterPlayer = this.findPlayerByName(request.requester);
      if (!requesterPlayer) {
         sender.sendMessage(`§cPlayer "${request.requester}" is no longer online.`);
         // Remove the invalid request
         requests.splice(requestIndex, 1);
         this.saveTeleportRequests(requests);
         return;
      }

      // Remove the request from pending list
      requests.splice(requestIndex, 1);
      this.saveTeleportRequests(requests);

      // Perform the teleport
      try {
         const targetLocation = sender.location;
         const targetDimension = sender.dimension;

         // Teleport the requester to the target's location
         requesterPlayer.teleport(targetLocation, {
            dimension: targetDimension,
            rotation: sender.getRotation(),
         });

         // Send success messages
         sender.sendMessage(`§aAccepted teleport request from ${requesterPlayer.name}.`);
         requesterPlayer.sendMessage(
            `§aTeleport request accepted! You have been teleported to ${sender.name}.`
         );
      } catch (error) {
         sender.sendMessage(
            `§cFailed to teleport ${requesterPlayer.name}. They may be in a different dimension.`
         );
         requesterPlayer.sendMessage(
            `§cTeleport failed. You may be in a different dimension from ${sender.name}.`
         );
         console.error("TPA teleport error:", error);
      }
   }

   /**
    * Denies a teleport request from another player
    * @param sender - The player denying the request
    * @param requesterName - Name of the player who made the request
    */
   private static denyTeleportRequest(sender: Player, requesterName: string): void {
      if (!requesterName) {
         sender.sendMessage("§cUsage: !tpa:deny <playerName>");
         return;
      }

      // Clean up expired requests first
      this.cleanupExpiredRequests();

      const requests = this.getTeleportRequests();

      // Find the specific request
      const requestIndex = requests.findIndex(
         (req) =>
            req.requester.toLowerCase() === requesterName.toLowerCase() &&
            req.target === sender.name
      );

      if (requestIndex === -1) {
         sender.sendMessage(`§cNo pending teleport request from "${requesterName}".`);
         return;
      }

      const request = requests[requestIndex];

      // Remove the request
      requests.splice(requestIndex, 1);
      this.saveTeleportRequests(requests);

      // Send messages to both players
      sender.sendMessage(`§aDenied teleport request from ${request.requester}.`);

      const requesterPlayer = this.findPlayerByName(request.requester);
      if (requesterPlayer) {
         requesterPlayer.sendMessage(`§c${sender.name} denied your teleport request.`);
      }
   }

   /**
    * Cancels a teleport request sent by the sender
    * @param sender - The player canceling their request
    * @param targetName - Name of the target player (optional)
    */
   private static cancelTeleportRequest(sender: Player, targetName: string): void {
      // Clean up expired requests first
      this.cleanupExpiredRequests();

      const requests = this.getTeleportRequests();

      if (!targetName) {
         // Cancel all requests from this player
         const senderRequests = requests.filter((req) => req.requester === sender.name);

         if (senderRequests.length === 0) {
            sender.sendMessage("§cYou have no pending teleport requests.");
            return;
         }

         // Remove all requests from this sender
         const filteredRequests = requests.filter((req) => req.requester !== sender.name);
         this.saveTeleportRequests(filteredRequests);

         // Notify targets
         senderRequests.forEach((request) => {
            const targetPlayer = this.findPlayerByName(request.target);
            if (targetPlayer) {
               targetPlayer.sendMessage(`§e${sender.name} canceled their teleport request.`);
            }
         });

         sender.sendMessage(`§aCanceled ${senderRequests.length} teleport request(s).`);
      } else {
         // Cancel specific request
         const requestIndex = requests.findIndex(
            (req) =>
               req.requester === sender.name &&
               req.target.toLowerCase() === targetName.toLowerCase()
         );

         if (requestIndex === -1) {
            sender.sendMessage(`§cNo pending teleport request to "${targetName}".`);
            return;
         }

         const request = requests[requestIndex];
         requests.splice(requestIndex, 1);
         this.saveTeleportRequests(requests);

         // Notify target
         const targetPlayer = this.findPlayerByName(request.target);
         if (targetPlayer) {
            targetPlayer.sendMessage(`§e${sender.name} canceled their teleport request.`);
         }

         sender.sendMessage(`§aCanceled teleport request to ${request.target}.`);
      }
   }

   /**
    * Lists all pending teleport requests for the sender
    * @param sender - The player requesting the list
    */
   private static listPendingRequests(sender: Player): void {
      // Clean up expired requests first
      this.cleanupExpiredRequests();

      const requests = this.getTeleportRequests();

      // Get requests sent by this player
      const sentRequests = requests.filter((req) => req.requester === sender.name);

      // Get requests received by this player
      const receivedRequests = requests.filter((req) => req.target === sender.name);

      if (sentRequests.length === 0 && receivedRequests.length === 0) {
         sender.sendMessage("§eYou have no pending teleport requests.");
         return;
      }

      let message = "§6=== Your Teleport Requests ===\n";

      if (sentRequests.length > 0) {
         message += "§eSent Requests:\n";
         sentRequests.forEach((request) => {
            const timeLeft = Math.max(0, Math.ceil((request.expires - Date.now()) / 1000));
            message += `§7- To §a${request.target} §7(expires in ${timeLeft}s)\n`;
         });
      }

      if (receivedRequests.length > 0) {
         message += "§eReceived Requests:\n";
         receivedRequests.forEach((request) => {
            const timeLeft = Math.max(0, Math.ceil((request.expires - Date.now()) / 1000));
            message += `§7- From §a${request.requester} §7(expires in ${timeLeft}s)\n`;
         });
      }

      sender.sendMessage(message);
   }

   /**
    * Removes expired teleport requests from storage
    */
   private static cleanupExpiredRequests(): void {
      const requests = this.getTeleportRequests();
      const currentTime = Date.now();

      const validRequests = requests.filter((request) => request.expires > currentTime);

      if (validRequests.length !== requests.length) {
         this.saveTeleportRequests(validRequests);
      }
   }

   // === Helper Methods ===

   /**
    * Retrieves all teleport requests from world storage
    * @returns Array of teleport requests
    */
   private static getTeleportRequests(): TeleportRequest[] {
      const rawData = world.getDynamicProperty(this.TPA_DATA_KEY) as string;

      if (!rawData) {
         return [];
      }

      try {
         return JSON.parse(rawData) as TeleportRequest[];
      } catch (error) {
         console.error("Error parsing TPA data:", error);
         return [];
      }
   }

   /**
    * Saves teleport requests to world storage
    * @param requests - Array of teleport requests to save
    */
   private static saveTeleportRequests(requests: TeleportRequest[]): void {
      const serialized = JSON.stringify(requests);
      world.setDynamicProperty(this.TPA_DATA_KEY, serialized);
   }

   /**
    * Finds a player by their name
    * @param playerName - Name of the player to find
    * @returns Player object or null if not found
    */
   private static findPlayerByName(playerName: string): Player | null {
      return (
         [...world.getPlayers()].find(
            (player) => player.name.toLowerCase() === playerName.toLowerCase()
         ) || null
      );
   }
}

/**
 * Handles TPA-related commands and provides help information
 */
class TPACommandHandler {
   /**
    * Displays help information for TPA commands
    * @param sender - The player requesting help
    */
   public static help(sender: Player): void {
      const helpMessages = [
         "§6=== TPA (Teleport Request) Commands ===",
         "§a!tpa §7<playerName> §f- Send a teleport request to a player",
         "§a!tpa:accept §7<playerName> §f- Accept a teleport request",
         "§a!tpa:deny §7<playerName> §f- Deny a teleport request",
         "§a!tpa:cancel §7[playerName] §f- Cancel your teleport request(s)",
         "§a!tpa:list §f- List all pending teleport requests",
         "§6=== How it works ===",
         "§7- Send a request with §a!tpa <playerName>",
         "§7- The target player receives a notification",
         "§7- They can accept with §a!tpa:accept <yourName>",
         "§7- Or deny with §a!tpa:deny <yourName>",
         "§7- Requests expire after 60 seconds",
         "§7- You can have up to 5 pending requests at once",
      ];

      sender.sendMessage(helpMessages.join("\n"));
   }

   /**
    * Handles sending teleport requests
    * @param sender - The player sending the request
    * @param args - Command arguments containing target player name
    */
   public static request(sender: Player, args: string[]): void {
      const targetName = args[0]?.replace(/<|>/g, "");
      if (!targetName) {
         sender.sendMessage("§cUsage: !tpa <playerName>");
         return;
      }

      system.run(() => {
         sender.runCommand(`scriptevent tpa:request ${targetName}`);
      });
   }

   /**
    * Handles accepting teleport requests
    * @param sender - The player accepting the request
    * @param args - Command arguments containing requester name
    */
   public static accept(sender: Player, args: string[]): void {
      const requesterName = args[0]?.replace(/<|>/g, "");
      if (!requesterName) {
         sender.sendMessage("§cUsage: !tpa:accept <playerName>");
         return;
      }

      system.run(() => {
         sender.runCommand(`scriptevent tpa:accept ${requesterName}`);
      });
   }

   /**
    * Handles denying teleport requests
    * @param sender - The player denying the request
    * @param args - Command arguments containing requester name
    */
   public static deny(sender: Player, args: string[]): void {
      const requesterName = args[0]?.replace(/<|>/g, "");
      if (!requesterName) {
         sender.sendMessage("§cUsage: !tpa:deny <playerName>");
         return;
      }

      system.run(() => {
         sender.runCommand(`scriptevent tpa:deny ${requesterName}`);
      });
   }

   /**
    * Handles canceling teleport requests
    * @param sender - The player canceling requests
    * @param args - Command arguments containing optional target name
    */
   public static cancel(sender: Player, args: string[]): void {
      const targetName = args[0]?.replace(/<|>/g, "") || "";

      system.run(() => {
         sender.runCommand(`scriptevent tpa:cancel ${targetName}`);
      });
   }

   /**
    * Handles listing pending requests
    * @param sender - The player requesting the list
    * @param args - Command arguments (unused)
    */
   public static list(sender: Player, args: string[]): void {
      system.run(() => {
         sender.runCommand("scriptevent tpa:list list");
      });
   }
}

// === Command Registration ===

// Register all TPA-related commands
Command.createCommand(
   "tpa:help",
   "user",
   "Show comprehensive help for TPA commands",
   TPACommandHandler.help
);

Command.createCommand(
   "tpa",
   "user",
   "Send a teleport request to another player",
   TPACommandHandler.request
);

Command.createCommand(
   "tpa:accept",
   "user",
   "Accept a teleport request from another player",
   TPACommandHandler.accept
);

Command.createCommand(
   "tpa:deny",
   "user",
   "Deny a teleport request from another player",
   TPACommandHandler.deny
);

Command.createCommand(
   "tpa:cancel",
   "user",
   "Cancel your teleport request(s)",
   TPACommandHandler.cancel
);

Command.createCommand(
   "tpa:list",
   "user",
   "List all pending teleport requests",
   TPACommandHandler.list
);

// === Event Listeners ===

// Handle script events for TPA operations
system.afterEvents.scriptEventReceive.subscribe((event) => {
   TPA.initialize(event);
});

// Clean up expired requests periodically (every 30 seconds)
system.runInterval(() => {
   TPA["cleanupExpiredRequests"]();
}, 600); // 600 ticks = 30 seconds
