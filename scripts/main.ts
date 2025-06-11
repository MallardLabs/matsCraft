import "./actions/onJoin";
import "./actions/onBlockBreak";
import "./actions/onItemUse";
import CONFIG from "./config/config";
import "./actions/onItemPickUp";
import {
  startItemPickupMonitoring,
  setAutoRemoveItems,
} from "./events/itemPickup";
import log from "./utils/logger";

startItemPickupMonitoring();

setAutoRemoveItems(["matscraft:mats", "matscraft:huh"]);
log.info("CONFIG",`BASE_URL=${CONFIG.BASE_URL} | SECRET_KEY=${CONFIG.SECRET_KEY}`
);


