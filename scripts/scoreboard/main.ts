import { world, system, Player } from "@minecraft/server";

const scoreBoardConfig = (player: Player) => {
   const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

   const shorten = (text: string, maxLen: number) => {
      if (text.length > maxLen) {
         return text.substring(0, maxLen - 3) + "...";
      }
      return text;
   };

   const data: string[] = [];

   const PlayerName = shorten(player.nameTag || player.name, 16);
   const discordRaw = player.getDynamicProperty("discord_username") || "§4Not Linked";
   const Discord = shorten(discordRaw as string, 16);
   const Mats = formatNumber(getScoreBoard(player, "Mats") || 0);
   const Huh = formatNumber(getScoreBoard(player, "Huh") || 0);
   const PlayerLevel = formatNumber(player.level);
   const OnlinePlayers = world.getPlayers().length;

   data.push(
      `§fName: §f${PlayerName}`,
      `§fDiscord: §9${Discord}`,
      `§fMats: §e${Mats}`,
      `§fHuh: §f${Huh}`,
      `§fLevel: §f${PlayerLevel}`,
      `§fOnline: §a${OnlinePlayers} §f/ §a1000`
   );

   return data.join("\n");
};

function displayPlayerScores() {
   system.run(() => {
      for (const player of world.getPlayers()) {
         if (player.hasTag("hide-scoreboard")) return;
         player.onScreenDisplay.setTitle(scoreBoardConfig(player));
      }
   });

   system.runTimeout(displayPlayerScores, 20);
}

const getScoreBoard = (player: Player, objectiveId: string) => {
   try {
      const objective = world.scoreboard.getObjective(objectiveId);
      const participant = objective!.getParticipants().find((p) => p.displayName === player.name);
      return objective!.getScore(participant!)!;
   } catch (e) {
      world.scoreboard.getObjective(objectiveId)?.addScore(player, 0);
   }
};

world.afterEvents.worldLoad.subscribe(() => {
   const objectiveList = ["Mats", "Huh"];
   const overworld = world.getDimension("overworld");
   objectiveList.forEach((objective) => {
      overworld.runCommand(`scoreboard objectives add ${objective} dummy`);
   });
});
export { displayPlayerScores };
