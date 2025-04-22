import { ActionFormData } from "@minecraft/server-ui";
import { getPlayerScore } from "../services/playerService.js";
import { showShop } from "./shop.js";
import { disconnectDiscord } from "../services/authService.js";

export const showDashboard = async (player) => {
  const playerScore = await getPlayerScore(player, "Mats");
  const form = new ActionFormData()
    .title("MatsCraft Dashboard")
    .button("Shop")
    .button("§cDisconnect Discord");

  form.show(player).then((res) => {
    if (res.canceled) return;

    switch (res.selection) {
      case 0:
        showShop(player);
        break;
      case 1:
        disconnectDiscord(player);
        break;
    }
  });
};