import itemPickup from "../events/itemPickup";
import httpReq from "../lib/httpReq";
import {
  getPlayerData,
  showActionBar,
  setPlayerScore,
} from "../utils/playerUtils";
import CONFIG from "../config/config";
import genSecret from "../lib/genSecret";

itemPickup.listen(async (data, actions) => {
  const { typeId, amount, player } = data;
  const playerData = getPlayerData(player);

  if (!playerData) {
    if (typeId === "matsphone:matsphone") {
      return;
    }
    actions.remove();
    showActionBar(
      player,
      "§cYour account is not linked! please link your account first!"
    );
    return;
  }

  if (typeId === "matscraft:mats") {
    const response = await httpReq.request({
      method: "POST",
      url: CONFIG.UPDATE_BALANCE,
      headers: {
        "Content-Type": "application/json",
        matscraft_token: genSecret(),
      },
      body: JSON.stringify({
        discord_id: playerData.data.discord_id,
        amount: amount,
      }),
    });
    if (response.status === 200) {
      const body = JSON.parse(response.body);
      setPlayerScore(player, "Mats", body.balance);
      showActionBar(player, "+" + amount + " Mats");
      actions.remove();
    } else {
      console.info(JSON.stringify("[DEBUG]" + response.body));
      showActionBar(player, "§cUpdate Balance Failed");
    }
  }
});
