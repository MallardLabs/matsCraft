import { MessageFormData } from "@minecraft/server-ui";
import { httpReq } from "../utils/httpReq.js";
import { ENDPOINTS } from "../config/endpoints.js";
import { getPlayerData } from "../utils/playerUtils.js";
import { getPlayerScore, setPlayerScore, showActionBar, giveItem } from "./playerService.js";
import { updateBalance } from "./balanceService.js";

export const buyPickaxe = async (player, data) => {
  const balance = await getPlayerScore(player, "Mats");
  const playerData = getPlayerData(player);
  const form = new MessageFormData()
    .title(`Buy ${data.name}?`)
    .body(data.message)
    .button1("Cancel")
    .button2(balance >= data.cost ? "§2Buy" : "§cNot Enough Mats");

  form.show(player).then(async (res) => {
    if (res.selection !== 1) return;

    const currentBalance = await getPlayerScore(player, "Mats");
    if (currentBalance < data.cost) {
      showActionBar(player, "§cNot Enough Mats!");
      return;
    }

    const response = await updateBalance(player,-data.cost)
    console.log(response.status)
    if (response.status === 200) {
      const body = JSON.parse(response.body);
      setPlayerScore(player, "Mats", body.balance);
      showActionBar(player, `§a${data.name} Purchased Successfully!`);
      giveItem(player, data.id);
    } else {
      console.log(JSON.stringify("debug"+response.body))
      showActionBar(player, "§cPurchase Failed");
    }
  });
};