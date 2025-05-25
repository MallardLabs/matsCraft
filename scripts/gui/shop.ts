import { ActionFormData, MessageFormData } from "@minecraft/server-ui";

import { getPlayerData } from "../utils/playerUtils.js";
import {
  getPlayerScore,
  setPlayerScore,
  showActionBar,
  giveItem,
} from "../utils/playerUtils";
import httpReq from "../lib/httpReq.js";
import genSecret from "../lib/genSecret.js";
import CONFIG from "../config/config.js";

const PICKAXES = [
  {
    id: "matscraft:nanndo_pickaxe",
    name: "Nanndo Pickaxe",
    cost: 50,
    icon: "textures/items/pickaxe/nando.png",
    message:
      "§lItem Name§r: Nanndo Pickaxe\n§lCost: §r50 Mats\n\n§lAbility\n§rBy Using Nanndo Pickaxe, you can get mats drops from common,uncommon blocks",
  },
  {
    id: "matscraft:lowpolyduck_pickaxe",
    name: "lowpolyduck Pickaxe",
    cost: 150,
    icon: "textures/items/pickaxe/lowpolyduck.png",
    message:
      "§lItem Name§r: lowpolyduck Pickaxe\n§lCost: §r100 Mats\n\n§lAbility:\n§rBy Using lowpolyduck Pickaxe, you can get mats drops from common,uncommon,rare,epic blocks",
  },
  {
    id: "matscraft:mezo_pickaxe",
    name: "Mezo Pickaxe",
    cost: 200,
    icon: "textures/items/pickaxe/mezo.png",
    message:
      "§lItem Name§r: Mezo Pickaxe\n§lCost: §r200 Mats\n\n§lAbility:\n§rBy Using Mezo Pickaxe, you can get mats drops from common,uncommon,rare,epic,legendary blocks",
  },
];

export const showShop = (player: any) => {
  const form = new ActionFormData().title("SHOP");
  PICKAXES.forEach((pickaxe) => {
    form.button(pickaxe.name, pickaxe.icon);
  });

  form.show(player).then((res) => {
    if (res.canceled) return;
    const selectedPickaxe = PICKAXES[res.selection ?? 0];
    buyPickaxe(player, selectedPickaxe);
  });
};

export const buyPickaxe = async (player: any, data?: any) => {
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

    const response = await updateBalance(player, -data.cost);

    if (response.status === 200) {
      const body = JSON.parse(response.body);
      setPlayerScore(player, "Mats", body.balance);
      showActionBar(player, `§a${data.name} Purchased Successfully!`);
      giveItem(player, data.id);
    } else {
      console.log(JSON.stringify("debug" + response.body));
      showActionBar(player, "§cPurchase Failed");
    }
  });
};

const updateBalance = async (player: any, amount: number) => {
  try {
    const response = await httpReq.request({
      method: "POST",
      url: CONFIG.UPDATE_BALANCE,
      headers: {
        "Content-Type": "application/json",
        matscraft_token: genSecret(),
      },
      body: JSON.stringify({
        discord_id: getPlayerData(player).data.discord_id,
        amount: amount,
      }),
    });
    return response;
  } catch (error) {
    console.error("Failed to update balance:", error);
    throw error;
  }
};
