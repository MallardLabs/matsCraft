import { world } from "@minecraft/server";

export const getPlayerScore = (player, objectiveName) => {
  const objective = world.scoreboard.getObjective(objectiveName) || null;
  return objective ? objective.getScore(player.scoreboardIdentity) || 0 : 0;
};

export const setPlayerScore = (player, objectiveName, score) => {
  player.runCommand(`scoreboard players set @s ${objectiveName} ${score}`);
};

export const showActionBar = (player, message) => {
  player.runCommand(`title @s actionbar ${message}`);
};

export const giveItem = (player, itemId, amount = 1) => {
  player.runCommand(`give @s ${itemId} ${amount}`);
};