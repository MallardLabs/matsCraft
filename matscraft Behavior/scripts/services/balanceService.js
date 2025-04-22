import { httpReq } from "../utils/httpReq.js";
import { ENDPOINTS } from "../config/endpoints.js";
import { getPlayerData } from "../utils/playerUtils.js";
import {
  getPlayerScore,
  setPlayerScore,
  showActionBar,
  giveItem,
} from "./playerService.js";
import { genSecret } from "../utils/genSecret.js";

export const updateBalance = async (player,amount) => {
  const playerData = getPlayerData(player);
  const response = await httpReq.request({
    method: "PUT",
    url: ENDPOINTS.UPDATE_BALANCE,
    body: JSON.stringify({
      discord_id: playerData.data.discord_id,
      amount: amount,
    }),
    headers: {
      "Content-Type": "application/json",
      "matscraft-secret": genSecret(),
    },
  });
  return response;
};
