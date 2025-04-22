import { httpReq } from "../utils/httpReq.js";
import { ENDPOINTS } from "../config/endpoints.js";
import { getPlayerData, updatePlayerData } from "../utils/playerUtils.js";
import { setPlayerScore, showActionBar } from "./playerService.js";
import { showLinkAccountForm } from "../gui/linkAccount.js";

export const verifyCode = async (player, code) => {
  try {
    const playerData = getPlayerData(player);
    const response = await httpReq.request({
      method: "POST",
      url: ENDPOINTS.AUTH,
      body: JSON.stringify({
        minecraft_id: playerData.xuid,
        minecraft_username: player.nameTag,
        token: code,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const body = JSON.parse(response.body);
    console.log(`Status: ${response.status}, Response: ${JSON.stringify(body)}`);

    if (response.status === 200) {
      playerData.data.is_linked = true;
      playerData.data.discord_id = body.discord_id;
      playerData.data.discord_username = body.discord_username;
      updatePlayerData(player, playerData);
      setPlayerScore(player, "Mats", body.balance);
      showActionBar(player, "§aAccount Linked Successfully!");
    } else {
      showActionBar(player, `§c${body.message}`);
      showLinkAccountForm(player, "§cInvalid Token!");
    }
  } catch (error) {
    console.error(`Verification failed: ${error.message}`);
    showActionBar(player, "§cVerification Error");
  }
};

export const disconnectDiscord = async (player) => {
  showActionBar(player, "Disconnecting Discord...");
  const playerData = getPlayerData(player);
  const response = await httpReq.request({
    method: "POST",
    url: ENDPOINTS.LOGOUT,
    body: JSON.stringify({
      minecraft_id: playerData.xuid,
    }),
    headers: { "Content-Type": "application/json" },
  });

  if (response.status === 200) {
    playerData.data.is_linked = false;
    playerData.data.discord_id = null;
    playerData.data.discord_username = null;
    updatePlayerData(player, playerData);
    setPlayerScore(player, "Mats", 0);
  } else {
    showActionBar(player, "§cFailed to Disconnect Discord");
  }
};