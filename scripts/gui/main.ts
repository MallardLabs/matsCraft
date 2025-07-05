import { getPlayerData } from "../utils/player/index";
import showDashboard from "./home";

import loginAlert from "./loginAlert";
const showMainMenu = (player: any) => {
  const playerData = getPlayerData(player);

  return playerData.data.is_linked ? showDashboard(player) : loginAlert(player);
};
export default showMainMenu;
