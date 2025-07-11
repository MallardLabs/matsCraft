import { world, Player, system } from "@minecraft/server";
import {
  ActionFormData,
  ModalFormData,
  ModalFormResponse,
  ActionFormResponse,
} from "@minecraft/server-ui";
import showMainMenu from "../gui/main";
import { getPlayerData, getPlayerScore } from "../utils/player/index";

/**
 * Entry point: shows the main admin menu.
 */
export default function showAdminMenu(player: any) {
  new ActionFormData()
    .title("Admin Menu")
    .button("View Player Data")
    .button("Ban a Player")
    .button("Show Dashboard")
    .show(player)
    .then((res: ActionFormResponse) => {
      if (res.canceled) return;

      switch (res.selection) {
        case 0:
          showPlayerSelector(player);
          break;
        case 1:
          showBanPlayerMenu(player);
          break;
        case 2:
          showMainMenu(player);
          break;
      }
    });
}

function showPlayerSelector(admin: any) {
  const players = world
    .getAllPlayers()
    .filter((p) => p.nameTag !== admin.nameTag);
  const names = players.map((p) => p.nameTag);

  if (names.length === 0) {
    return admin.sendMessage("§cNo other players online.");
  }

  new ModalFormData()
    .title("Select a Player")
    .dropdown("Players", names)
    .show(admin)
    .then((res: ModalFormResponse) => {
      if (res.canceled) return;
      const index = res.formValues?.[0] as number;
      const selected = players[index];
      if (!selected) return admin.sendMessage("§cPlayer not found.");

      showPlayerDetails(admin, selected);
    });
}

export function showPlayerDetails(admin: any, target: Player) {
  const data = getPlayerData(target);
  const inventoryComp = target.getComponent("minecraft:inventory") as any;

  const mats = getPlayerScore(target, "Mats");
  const huh = getPlayerScore(target, "Huh");

  const itemCounts: Record<string, number> = {};

  if (inventoryComp?.container) {
    const container = inventoryComp.container;

    for (let i = 0; i < container.size; i++) {
      const item = container.getItem(i);
      if (item) {
        const itemName = item.typeId.replace("minecraft:", "");
        itemCounts[itemName] = (itemCounts[itemName] || 0) + item.amount;
      }
    }
  }

  const inventoryDisplay =
    Object.entries(itemCounts)
      .map(([name, count]) => `- ${capitalize(name)}: ${count}`)
      .join("\n") || "Inventory is empty.";

  const info = [
    `§6XUID: §f${data.xuid}`,
    `§6Discord: §f${data.data?.discord_username ?? "N/A"}`,
    `§6Mats: §f${mats}`,
    `§6Huh: §f${huh}`,
    ``,
    `§6Inventory:\n§f${inventoryDisplay}`,
  ].join("\n");

  const form = new ActionFormData()
    .title(`${target.nameTag}'s Data`)
    .body(info)
    .button("Teleport to Player")
    .button("Apply Invisibility + Night Vision")
    .button("Back");

  form.show(admin).then((res) => {
    if (res.canceled) return;

    switch (res.selection) {
      case 0:
        teleportToPlayer(admin, target);
        break;
      case 1:
        applyEffects(admin);
        break;
      case 2:
        showAdminMenu(admin);
        break;
    }
  });
}

function teleportToPlayer(source: any, target: Player) {
  source.teleport(target.location, {
    dimension: target.dimension,
    rotation: target.getRotation(),
  });
  source.sendMessage(`§aTeleported to §e${target.nameTag}`);
}

function applyEffects(player: Player) {
  player.runCommand(`effect @s invisibility 999999 1 true`);
  player.runCommand(`effect @s night_vision 999999 1 true`);
  player.sendMessage("§bEffects applied: Invisibility + Night Vision.");
}

function showBanPlayerMenu(admin: any) {
  const players = world
    .getAllPlayers()
    .filter((p) => p.nameTag !== admin.nameTag);
  const names = players.map((p) => p.nameTag);

  if (names.length === 0) {
    return admin.sendMessage("§cNo players to ban.");
  }

  new ModalFormData()
    .title("Ban Player")
    .dropdown("Select player to ban", names)
    .show(admin)
    .then((res: ModalFormResponse) => {
      if (res.canceled) return;
      const index = res.formValues?.[0] as number;
      const selectedName = names[index];

      confirmBan(admin, selectedName);
    });
}

function confirmBan(admin: any, playerName: string) {
  new ActionFormData()
    .title("Confirm Ban")
    .body(`Are you sure you want to ban §c${playerName}§f?`)
    .button("Yes, Ban")
    .button("Cancel")
    .show(admin)
    .then((res) => {
      if (res.selection === 0) {
        banPlayer(admin, playerName);
      }
    });
}

function banPlayer(source: Player, playerName: string) {
  const player = world.getPlayers().find((p) => p.nameTag === playerName);
  if (!player) {
    return source.sendMessage("§cPlayer not found.");
  }

  player.sendMessage("§cYou have been banned by an admin.");
  player.runCommand("kick @s You have been banned.");

  source.sendMessage(`§e${playerName} §ahas been banned.`);
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
