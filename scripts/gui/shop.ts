import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import {
  getPlayerScore,
  setPlayerScore,
  showActionBar,
  getPlayerData,
  giveItem,
} from "../utils/player/index";

import genSecret from "../lib/genSecret.js";

import { httpReq } from "../lib/httpReq";
import { variables } from "@minecraft/server-admin";
import { pickaxeShop } from "../config/pickaxe/index";

export const showShop = (player: any) => {
  const form = new ActionFormData().title("SHOP");
  form.body("Purchase Pickaxes");
  pickaxeShop.forEach((pickaxe) => {
    form.button(pickaxe.name, pickaxe.icon);
  });

  form.show(player).then((res) => {
    if (res.canceled) return;
    const selectedPickaxe = pickaxeShop[res.selection ?? 0];
    buyPickaxe(player, selectedPickaxe);
  });
};

export const buyPickaxe = async (player: any, data?: any) => {
  const balance = getPlayerScore(player, "Mats");
  const playerData = getPlayerData(player);
  const form = new MessageFormData()
    .title(`Buy ${data.name}?`)
    .body(data.message)
    .button1("Cancel")
    .button2(balance >= data.cost ? "§2Buy" : "§cNot Enough Mats");

  form.show(player).then(async (res) => {
    if (res.selection !== 1) return;

    const currentBalance = getPlayerScore(player, "Mats");
    if (currentBalance < data.cost) {
      showActionBar(player, "§cNot Enough Mats!");
      return;
    }

    const response = await updateBalance(player, -data.cost);

    if (response.status === 200) {
      const body = JSON.parse(response.body);
      console.log(response.body);
      setPlayerScore(player, "Mats", body.balance.mats);
      showActionBar(player, `§a${data.name} Purchased Successfully!`);
      giveItem(player, data.id);
    } else {
      console.log(JSON.stringify("debug" + response.body));
      showActionBar(player, "§cPurchase Failed");
    }
  });
};

const updateBalance = async (player: any, amount: number) => {
  const playerData = getPlayerData(player);
  try {
    const response = await httpReq({
      method: "post",
      url: `${variables.get("BASE_URL")}/users/${
        playerData.xuid
      }/update_balance?type=transaction`,
      headers: {
        "Content-Type": "application/json",
        "matscraft-secret": genSecret(),
      },
      data: JSON.stringify({
        data: { mats: amount },
      }),
    });
    return response;
  } catch (error) {
    console.error("Failed to update balance:", error);
    throw error;
  }
};
