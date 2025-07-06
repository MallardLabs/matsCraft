import { world, Player, system, ScriptEventCommandMessageAfterEvent } from "@minecraft/server";
import { getWorldData, setWorldData } from "../utils/world/index";
import { Command } from "./customCommand";

/**
 * Represents a player's chat mode configuration
 */
type ChatMode = {
   name: string;
   mode: "global" | "group";
};

/**
 * Represents the data structure for a group
 */
type GroupData = {
   name: string;
   owner: string;
   pending: string[]; // Players who have requested to join
   members: string[]; // Current group members
};

/**
 * Main Group class that handles all group-related operations
 */
class Group {
   // Dynamic property keys for data storage
   private static readonly GROUP_DATA_KEY = "groupData";
   private static readonly CHAT_MODE_KEY = "playerChatModes";
   private static readonly GROUP_CHAT_TAG = "groupChatMode";

   /**
    * Main entry point for handling group-related script events
    * @param event - The script event that triggered this handler
    */
   static initialize(event: ScriptEventCommandMessageAfterEvent): void {
      if (!event.id.includes("group:")) return;

      const action = event.id.split("group:")[1];
      const args = event.message.replace(/<|>/g, "").replace(" ", "");
      const sender = event.sourceEntity as Player;

      switch (action) {
         case "create":
            this.createGroup(sender, args);
            break;
         case "join":
            this.joinGroup(sender, args);
            break;
         case "leave":
            this.leaveGroup(sender, args);
            break;
         case "accept":
            this.acceptJoinRequest(sender, args);
            break;
         case "pending":
            this.showPendingRequests(sender);
            break;
         case "chatmode":
            this.setChatMode(sender, args);
            break;
         case "chat":
            this.sendGroupChat(sender, args);
            break;
      }
   }

   /**
    * Sets the chat mode for a player (global or group)
    * @param sender - The player setting their chat mode
    * @param mode - The chat mode to set ("global" or "group")
    */
   private static setChatMode(sender: Player, mode: string): void {
      const normalizedMode = mode.toLowerCase();

      // Validate chat mode
      if (normalizedMode !== "global" && normalizedMode !== "group") {
         sender.sendMessage("§cInvalid chat mode. Use 'global' or 'group'.");
         return;
      }

      // Check if player is in a group when setting group mode
      if (normalizedMode === "group") {
         const groupMap = this.getGroupData();
         const isInGroup = [...groupMap.values()].some((group) =>
            group.members.includes(sender.name)
         );

         if (!isInGroup) {
            sender.sendMessage("§cYou are not a member of any group.");
            return;
         }
      }

      // Update player's chat mode
      const chatModes = this.getPlayerChatModes();
      chatModes.set(sender.name, {
         name: sender.name,
         mode: normalizedMode as "global" | "group",
      });

      this.saveChatModeData(chatModes);
      sender.sendMessage(`§aYour chat mode has been set to "${normalizedMode}".`);
   }

   /**
    * Shows pending join requests for the group owned by the sender
    * @param sender - The group owner requesting to see pending requests
    */
   private static showPendingRequests(sender: Player): void {
      const groupMap = this.getGroupData();
      const ownedGroup = this.findOwnedGroup(groupMap, sender.name);

      if (!ownedGroup) {
         sender.sendMessage("§cYou don't own any group.");
         return;
      }

      const [groupName, group] = ownedGroup;

      if (group.pending.length === 0) {
         sender.sendMessage("§eNo pending join requests.");
         return;
      }

      sender.sendMessage(
         `§6Pending requests for "${groupName}":\n§7${group.pending.join(", ")}\n` +
            `§eUse !group:accept <playerName> to accept individual requests or ` +
            `!group:accept all to accept all requests.`
      );
   }

   /**
    * Accepts join requests for a group
    * @param sender - The group owner accepting requests
    * @param args - Either a player name or "all" to accept all requests
    */
   private static acceptJoinRequest(sender: Player, args: string): void {
      const groupMap = this.getGroupData();
      const ownedGroup = this.findOwnedGroup(groupMap, sender.name);

      if (!ownedGroup) {
         sender.sendMessage("§cYou don't own any group.");
         return;
      }

      const [groupName, group] = ownedGroup;

      if (group.pending.length === 0) {
         sender.sendMessage("§cNo pending join requests.");
         return;
      }

      // Accept all pending requests
      if (args.toLowerCase() === "all") {
         this.acceptAllRequests(group, groupName, sender);
         groupMap.set(groupName, group);
         this.saveGroupData(groupMap);
         return;
      }

      // Accept individual request
      this.acceptIndividualRequest(group, groupName, args, sender);
      groupMap.set(groupName, group);
      this.saveGroupData(groupMap);
   }

   /**
    * Accepts all pending join requests for a group
    * @param group - The group data
    * @param groupName - Name of the group
    * @param owner - The group owner
    */
   private static acceptAllRequests(group: GroupData, groupName: string, owner: Player): void {
      const acceptedPlayers = [...group.pending];

      // Add all pending players to members
      group.members.push(...group.pending);

      // Notify all accepted players
      acceptedPlayers.forEach((playerName) => {
         const player = this.findPlayerByName(playerName);
         if (player) {
            player.sendMessage(`§aYou have been accepted into group "${groupName}".`);
         }
      });

      // Clear pending list
      group.pending = [];
      owner.sendMessage(`§aAccepted all ${acceptedPlayers.length} join requests.`);
   }

   /**
    * Accepts an individual join request
    * @param group - The group data
    * @param groupName - Name of the group
    * @param playerName - Name of the player to accept
    * @param owner - The group owner
    */
   private static acceptIndividualRequest(
      group: GroupData,
      groupName: string,
      playerName: string,
      owner: Player
   ): void {
      const pendingIndex = group.pending.findIndex(
         (name) => name.toLowerCase() === playerName.toLowerCase()
      );

      if (pendingIndex === -1) {
         owner.sendMessage(`§cNo pending request from "${playerName}".`);
         return;
      }

      // Move player from pending to members
      const acceptedPlayer = group.pending.splice(pendingIndex, 1)[0];
      group.members.push(acceptedPlayer);

      // Notify the accepted player
      const player = this.findPlayerByName(acceptedPlayer);
      if (player) {
         player.sendMessage(`§aYou have been accepted into group "${groupName}".`);
      }

      owner.sendMessage(`§aAccepted ${acceptedPlayer} into "${groupName}".`);
   }

   /**
    * Handles a player's request to join a group
    * @param sender - The player requesting to join
    * @param groupName - Name of the group to join
    */
   private static joinGroup(sender: Player, groupName: string): void {
      const groupMap = this.getGroupData();
      const group = groupMap.get(groupName);

      if (!group) {
         sender.sendMessage(`§cGroup "${groupName}" not found.`);
         return;
      }

      // Check if already a member
      if (group.members.includes(sender.name)) {
         sender.sendMessage("§cYou are already a member of this group.");
         return;
      }

      // Check if request is already pending
      if (group.pending.includes(sender.name)) {
         sender.sendMessage("§cYou have already requested to join this group.");
         return;
      }

      // Add to pending list
      group.pending.push(sender.name);
      groupMap.set(groupName, group);
      this.saveGroupData(groupMap);

      sender.sendMessage(`§aJoin request sent to group "${groupName}".`);

      // Notify group owner
      const owner = this.findPlayerByName(group.owner);
      if (owner) {
         owner.sendMessage(
            `§e${sender.name} has requested to join group "${groupName}". ` +
               `§7Use !group:accept ${sender.name} to accept the request.`
         );
      }
   }

   /**
    * Handles a player leaving a group
    * @param sender - The player leaving the group
    * @param groupName - Name of the group to leave
    */
   private static leaveGroup(sender: Player, groupName: string): void {
      const groupMap = this.getGroupData();
      const group = groupMap.get(groupName);

      if (!group) {
         sender.sendMessage(`§cGroup "${groupName}" not found.`);
         return;
      }

      // Check if player is actually a member
      if (!group.members.includes(sender.name)) {
         sender.sendMessage("§cYou are not a member of this group.");
         return;
      }

      // If owner leaves, remove the entire group
      if (group.owner === sender.name) {
         this.disbandGroup(groupName, groupMap, sender);
         return;
      }

      // Remove regular member from group
      group.members = group.members.filter((member) => member !== sender.name);
      groupMap.set(groupName, group);
      this.saveGroupData(groupMap);

      sender.sendMessage(`§aYou have left group "${groupName}".`);

      // Notify owner about member leaving
      const owner = this.findPlayerByName(group.owner);
      if (owner) {
         owner.sendMessage(`§e${sender.name} has left your group "${groupName}".`);
      }
   }

   /**
    * Creates a new group
    * @param sender - The player creating the group
    * @param groupName - Name of the group to create
    */
   private static createGroup(sender: Player, groupName: string): void {
      const groupMap = this.getGroupData();

      // Check if player is already in a group
      const existingMembership = this.findPlayerMembership(groupMap, sender.name);
      if (existingMembership) {
         if (existingMembership.group.owner === sender.name) {
            sender.sendMessage(
               `§cYou already own a group: "${existingMembership.group.name}". ` +
                  `You can only own one group at a time.`
            );
         } else {
            sender.sendMessage(
               `§cYou are already a member of group "${existingMembership.group.name}". ` +
                  `Leave that group first before creating a new one.`
            );
         }
         return;
      }

      // Check if group name already exists
      if (groupMap.has(groupName)) {
         sender.sendMessage(`§cGroup "${groupName}" already exists. Choose a different name.`);
         return;
      }

      // Create new group
      const newGroup: GroupData = {
         name: groupName,
         owner: sender.name,
         members: [sender.name],
         pending: [],
      };

      groupMap.set(groupName, newGroup);
      this.saveGroupData(groupMap);

      sender.sendMessage(`§aGroup "${groupName}" created successfully! You are now the owner.`);
   }

   /**
    * Sends a message to all members of the sender's group
    * @param sender - The player sending the message
    * @param message - The message to send
    */
   private static sendGroupChat(sender: Player, message: string): void {
      const groupMap = this.getGroupData();
      const membership = this.findPlayerMembership(groupMap, sender.name);

      if (!membership) {
         sender.sendMessage("§cYou are not in a group.");
         return;
      }

      const { group } = membership;
      const groupMembers = world
         .getPlayers()
         .filter((player) => group.members.includes(player.name));

      const formattedMessage = `§9[Group: ${group.name}] §7${sender.name}: §f${message}`;
      groupMembers.forEach((player) => {
         player.sendMessage(formattedMessage);
      });
   }

   // === Helper Methods ===

   /**
    * Retrieves all group data from world storage
    * @returns Map of group names to group data
    */
   private static getGroupData(): Map<string, GroupData> {
      const rawData = world.getDynamicProperty(this.GROUP_DATA_KEY) as string;

      if (!rawData) {
         return new Map();
      }

      try {
         const parsed = JSON.parse(rawData) as Record<string, GroupData>;
         return new Map(Object.entries(parsed));
      } catch (error) {
         console.error("Error parsing group data:", error);
         return new Map();
      }
   }

   /**
    * Retrieves player chat mode data from world storage
    * @returns Map of player names to chat modes
    */
   private static getPlayerChatModes(): Map<string, ChatMode> {
      const rawData = world.getDynamicProperty(this.CHAT_MODE_KEY) as string;

      if (!rawData) {
         return new Map();
      }

      try {
         const parsed = JSON.parse(rawData) as Record<string, ChatMode>;
         return new Map(Object.entries(parsed));
      } catch (error) {
         console.error("Error parsing player chat modes:", error);
         return new Map();
      }
   }

   /**
    * Saves group data to world storage
    * @param groupMap - Map of group data to save
    */
   private static saveGroupData(groupMap: Map<string, GroupData>): void {
      const serialized = JSON.stringify(Object.fromEntries(groupMap.entries()));
      world.setDynamicProperty(this.GROUP_DATA_KEY, serialized);
   }

   /**
    * Saves chat mode data to world storage
    * @param chatModes - Map of chat mode data to save
    */
   private static saveChatModeData(chatModes: Map<string, ChatMode>): void {
      const serialized = JSON.stringify(Object.fromEntries(chatModes.entries()));
      world.setDynamicProperty(this.CHAT_MODE_KEY, serialized);
   }

   /**
    * Finds a group owned by a specific player
    * @param groupMap - Map of all groups
    * @param playerName - Name of the player
    * @returns Tuple of [groupName, groupData] or null if not found
    */
   private static findOwnedGroup(
      groupMap: Map<string, GroupData>,
      playerName: string
   ): [string, GroupData] | null {
      const entry = [...groupMap.entries()].find(([, group]) => group.owner === playerName);
      return entry || null;
   }

   /**
    * Finds a player's membership in any group
    * @param groupMap - Map of all groups
    * @param playerName - Name of the player
    * @returns Object with group name and data, or null if not found
    */
   private static findPlayerMembership(
      groupMap: Map<string, GroupData>,
      playerName: string
   ): { groupName: string; group: GroupData } | null {
      const entry = [...groupMap.entries()].find(([, group]) => group.members.includes(playerName));

      if (entry) {
         return { groupName: entry[0], group: entry[1] };
      }
      return null;
   }

   /**
    * Disbands a group completely (used when owner leaves)
    * @param groupName - Name of the group to disband
    * @param groupMap - Map of all groups
    * @param owner - The owner who is leaving/disbanding the group
    */
   private static disbandGroup(
      groupName: string,
      groupMap: Map<string, GroupData>,
      owner: Player
   ): void {
      const group = groupMap.get(groupName);
      if (!group) return;

      // Notify all members that the group is being disbanded
      const allMembers = world
         .getPlayers()
         .filter((player) => group.members.includes(player.name) && player.name !== owner.name);

      allMembers.forEach((member) => {
         member.sendMessage(`§cGroup "${groupName}" has been disbanded because the owner left.`);
         // Remove group chat mode if they were using it
         if (member.hasTag(this.GROUP_CHAT_TAG)) {
            member.removeTag(this.GROUP_CHAT_TAG);
         }
      });

      // Remove group from data
      groupMap.delete(groupName);
      this.saveGroupData(groupMap);

      // Clean up chat modes for disbanded group members
      this.cleanupChatModes(group.members);

      owner.sendMessage(`§aYou have left and disbanded group "${groupName}".`);
   }

   /**
    * Cleans up chat modes for players who are no longer in any group
    * @param playerNames - Array of player names to clean up
    */
   private static cleanupChatModes(playerNames: string[]): void {
      const chatModes = this.getPlayerChatModes();
      let hasChanges = false;

      playerNames.forEach((playerName) => {
         const player = this.findPlayerByName(playerName);
         if (player) {
            // Remove group chat tag if they have it
            if (player.hasTag(this.GROUP_CHAT_TAG)) {
               player.removeTag(this.GROUP_CHAT_TAG);
            }

            // Set chat mode to global
            if (chatModes.has(playerName)) {
               chatModes.set(playerName, {
                  name: playerName,
                  mode: "global",
               });
               hasChanges = true;
            }
         }
      });

      if (hasChanges) {
         this.saveChatModeData(chatModes);
      }
   }

   /**
    * Finds a player by their name
    * @param playerName - Name of the player to find
    * @returns Player object or null if not found
    */
   private static findPlayerByName(playerName: string): Player | null {
      return [...world.getPlayers()].find((player) => player.name === playerName) || null;
   }
}

/**
 * Handles group-related commands and provides help information
 */
class GroupCommandHandler {
   /**
    * Displays help information for group commands
    * @param sender - The player requesting help
    */
   public static help(sender: Player): void {
      const helpMessages = [
         "§6=== Group Commands ===",
         "§a!group:create §7<groupName> §f- Create a new group",
         "§a!group:join §7<groupName> §f- Request to join a group",
         "§a!group:leave §7<groupName> §f- Leave a group",
         "§a!group:accept §7<playerName|all> §f- Accept join request(s)",
         "§a!group:pending §f- View pending join requests",
         "§a!chat:global §f- Set chat mode to global",
         "§a!chat:group §f- Set chat mode to group only",
         "§6=== Tips ===",
         "§7- You can only be in one group at a time",
         "§7- Group owners cannot leave their own group",
         "§7- Use group chat mode to send messages only to group members",
      ];

      sender.sendMessage(helpMessages.join("\n"));
   }

   /**
    * Handles group creation command
    * @param sender - The player creating the group
    * @param args - Command arguments containing group name
    */
   public static create(sender: Player, args: string[]): void {
      const groupName = args[0]?.replace(/<|>/g, "");
      if (!groupName) {
         sender.sendMessage("§cUsage: !group:create <groupName>");
         return;
      }

      system.run(() => {
         sender.runCommand(`scriptevent group:create ${groupName}`);
      });
   }

   /**
    * Handles group join command
    * @param sender - The player joining the group
    * @param args - Command arguments containing group name
    */
   public static join(sender: Player, args: string[]): void {
      const groupName = args[0]?.replace(/<|>/g, "");
      if (!groupName) {
         sender.sendMessage("§cUsage: !group:join <groupName>");
         return;
      }

      system.run(() => {
         sender.runCommand(`scriptevent group:join ${groupName}`);
      });
   }

   /**
    * Handles accepting join requests
    * @param sender - The group owner accepting requests
    * @param args - Command arguments containing player name or "all"
    */
   public static accept(sender: Player, args: string[]): void {
      const playerName = args[0]?.replace(/<|>/g, "");
      if (!playerName) {
         sender.sendMessage("§cUsage: !group:accept <playerName|all>");
         return;
      }

      system.run(() => {
         sender.runCommand(`scriptevent group:accept ${playerName}`);
      });
   }

   /**
    * Handles group leave command
    * @param sender - The player leaving the group
    * @param args - Command arguments containing group name
    */
   public static leave(sender: Player, args: string[]): void {
      const groupName = args[0]?.replace(/<|>/g, "");
      if (!groupName) {
         sender.sendMessage("§cUsage: !group:leave <groupName>");
         return;
      }

      system.run(() => {
         sender.runCommand(`scriptevent group:leave ${groupName}`);
      });
   }

   /**
    * Handles viewing pending requests
    * @param sender - The group owner viewing requests
    * @param args - Command arguments (unused)
    */
   public static pending(sender: Player, args: string[]): void {
      system.run(() => {
         sender.runCommand("scriptevent group:pending pending");
      });
   }
}

// === Command Registration ===

// Register all group-related commands
Command.createCommand(
   "group:help",
   "user",
   "Show comprehensive help for group commands",
   GroupCommandHandler.help
);

Command.createCommand("group:create", "user", "Create a new group", GroupCommandHandler.create);

Command.createCommand(
   "group:join",
   "user",
   "Request to join an existing group",
   GroupCommandHandler.join
);

Command.createCommand(
   "group:leave",
   "user",
   "Leave a group (disbands if you're the owner)",
   GroupCommandHandler.leave
);

Command.createCommand(
   "group:accept",
   "user",
   "Accept pending join requests",
   GroupCommandHandler.accept
);

Command.createCommand(
   "group:pending",
   "user",
   "View pending join requests for your group",
   GroupCommandHandler.pending
);

// Chat mode commands
Command.createCommand(
   "chat:global",
   "user",
   "Set chat mode to global (messages visible to all players)",
   (sender: Player, args: string[]) => {
      system.run(() => {
         sender.runCommand("scriptevent group:chatmode global");
         sender.removeTag(Group["GROUP_CHAT_TAG"]);
      });
   }
);

Command.createCommand(
   "chat:group",
   "user",
   "Set chat mode to group only (messages visible only to group members)",
   (sender: Player, args: string[]) => {
      system.run(() => {
         sender.runCommand("scriptevent group:chatmode group");
         sender.addTag(Group["GROUP_CHAT_TAG"]);
      });
   }
);

// === Event Listeners ===

// Handle script events for group operations
system.afterEvents.scriptEventReceive.subscribe((event) => {
   Group.initialize(event);
});

// Intercept chat messages when in group chat mode
world.beforeEvents.chatSend.subscribe((event) => {
   const sender = event.sender;

   // If player is in group chat mode, redirect their message to group chat
   if (sender.hasTag(Group["GROUP_CHAT_TAG"])) {
      event.cancel = true;

      system.run(() => {
         sender.runCommand(`scriptevent group:chat ${event.message}`);
      });
   }
});
