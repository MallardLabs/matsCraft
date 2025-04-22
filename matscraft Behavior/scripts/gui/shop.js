import { ActionFormData } from "@minecraft/server-ui";
import { buyPickaxe } from "../services/shopService.js";
import { PICKAXES } from "../config/items.js";

export const showShop = (player) => {
  const form = new ActionFormData().title("Shop");
  PICKAXES.forEach((pickaxe) => {
    form.button(pickaxe.name, pickaxe.icon);
  });

  form.show(player).then((res) => {
    if (res.canceled) return;
    const selectedPickaxe = PICKAXES[res.selection];
    buyPickaxe(player, selectedPickaxe);
  });
};