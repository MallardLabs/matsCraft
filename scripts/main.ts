import { world, system, Player, ItemStack } from "@minecraft/server";
import { displayPlayerScores } from "./scoreboard/main";

import logger from "./utils/logger";
import "./actions/onBlockBreak";
import "./actions/onJoin";
import "./actions/onItemPickup";
import "./actions/onItemUse";
import "./actions/onHopperOpen";
import { variables } from "@minecraft/server-admin";
displayPlayerScores();

logger.info(
   "CONFIG",
   `BASE_URL=${variables.get("BASE_URL")} | SECRET_KEY=${variables.get("SECRET_KEY")} `
);
system.run(() => {
   for (const player of world.getPlayers()) {
      console.log(`[${player.nameTag}]`, player.getDynamicProperty("pendingUpdate"));
   }
});
