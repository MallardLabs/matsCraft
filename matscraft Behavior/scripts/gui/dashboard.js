import { ActionFormData } from "@minecraft/server-ui";
import { getPlayerScore } from "../services/playerService.js";
import { showShop } from "./shop.js";
import { disconnectDiscord } from "../services/authService.js";
import { getPlayerData } from "../utils/playerUtils.js";
export const showDashboard = async (player) => {
  const playerScore = await getPlayerScore(player, "Mats");
  const playerData = getPlayerData(player);
  const form = new ActionFormData().title("MATSCRAFT");
  form
    .body(
      `§lName: §l§r§2${player.name}\n§r§lDiscord: §r§9${playerData.data.discord_username}\n§r§lMats: §l§r§e${formatNumber(playerScore)}`
    )

    .button("Rewards", "textures/ui/promo_holiday_gift_small")
    .button("D", "")
    .button("Shop", "textures/ui/hammer_l")
    .button("Logout", "textures/custom_ui/logout");

  form.show(player).then((res) => {
    if (res.canceled) return;

    switch (res.selection) {
      case 2:
        showShop(player);
        break;
      case 3:
        disconnectDiscord(player);
        break;
    }
  });
};

function formatNumber(input) {
  let num = Number(input);

  if (isNaN(num)) {
      return 'Invalid number';
  }

  if (num >= 100_000) {
      return (num / 1_000).toFixed(0) + 'K';
  } else {
      return num.toLocaleString('en-US');
  }
}