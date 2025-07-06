import { displayPlayerScores } from "./scoreboard/main";

import logger from "./utils/logger";
import "./actions/onBlockBreak";
import "./actions/onJoin";
import "./actions/onItemPickup";
import "./actions/onItemUse";
import "./actions/onHopperOpen";
import "./command/index";
import "./actions/onLobby";
import { variables } from "@minecraft/server-admin";
import { system, world } from "@minecraft/server";
import { getWorldData, setWorldData } from "./utils/world/index";
displayPlayerScores();

logger.info(
   "CONFIG",
   `BASE_URL=${variables.get("BASE_URL")} | SECRET_KEY=${variables.get("SECRET_KEY")} `
);
world.afterEvents.worldLoad.subscribe(() => {
   const groupProperty = ["playerGroups", "playerChatModes", "groupData"].map((prop) => {
      world.getDynamicProperty(prop) ?? world.setDynamicProperty(prop, "{}");
   });
});
