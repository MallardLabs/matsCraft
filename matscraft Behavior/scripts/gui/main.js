import { getPlayerData } from "../utils/playerUtils.js";
import { showHome } from "./home.js";
import { showDashboard } from "./dashboard.js";

export const showMainMenu = (player) => {
  const playerData = getPlayerData(player);
  return playerData.data.is_linked ? showDashboard(player) : showHome(player);
};