import { system, world } from "@minecraft/server";

/*
 * This Action Will Remove The Specific Items From The Hopper
 * To Prevent Duplication Glitch: https://www.youtube.com/watch?v=B3Fv9lX6zbk
 */
world.beforeEvents.playerInteractWithBlock.subscribe(async (data) => {
  if (data.block.typeId.includes("hopper")) {
    system.run(() => {
      const inventoryComponent = data.block.getComponent("minecraft:inventory");

      if (inventoryComponent?.container) {
        const container = inventoryComponent.container;

        const specificItemsToRemove = [
          { typeId: "matscraft:mats" },
          { typeId: "matscraft:huh" },
          { typeId: "matscraft:common_mats_ore" },
          { typeId: "matscraft:uncommon_mats_ore" },
          { typeId: "matscraft:rare_mats_ore" },
          { typeId: "matscraft:epic_mats_ore" },
          { typeId: "matscraft:legendary_mats_ore" },
        ];

        const size = container.size;

        for (let i = 0; i < size; i++) {
          const item = container.getItem(i);

          if (item) {
            console.log(`Slot ${i}: ${item.typeId}`);

            const shouldRemove = specificItemsToRemove.some(
              (specificItem) => item.typeId === specificItem.typeId
            );

            if (shouldRemove) {
              console.log(`Removing ${item.typeId} from slot ${i}`);

              container.setItem(i, undefined);
            }
          }
        }
      }
    });
  }
});
