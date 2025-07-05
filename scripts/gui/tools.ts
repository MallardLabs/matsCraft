import { world, Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import {
  getPlayerData,
  setPlayerData,
  showActionBar,
} from "../utils/player/index";

export default function showTools(player: any) {
  let form = new ActionFormData();
  form.title("TOOLS");
  form.body("User Toolkit");
  form.button("Set Home", "textures/ui/pointer");
  form.button("Teleport To Home", "textures/items/wind_charge");
  form.button("Teleport To Lobby", "textures/items/wind_charge");

  form.show(player).then((res) => {
    if (res.canceled) return;
    if (res.selection === 0) {
      setHome(player);
    }
    if (res.selection === 1) {
      teleportToHome(player);
    }
    if (res.selection === 2) {
      teleportToLobby(player);
    }
  });
}
const setHome = (player: Player) => {
  const location = player.location;
  setPlayerData(player, "home", JSON.stringify(location));
  showActionBar(player, `§aSet Home Location Successfully!`);
};
const teleportToHome = (player: Player) => {
  const location = player.getDynamicProperty("home") as string;
  if (location) {
    const { x, y, z } = JSON.parse(location);
    player.runCommand(`tp @s ${x} ${y} ${z}`);
    return;
  }
  showActionBar(player, `§cHome Location Not Set!`);
};
const teleportToLobby = (player: Player) => {
  player.runCommand(`tp @s 4 182 196`);
  return;
};
