import { world, Player, GameMode, system } from "@minecraft/server";
import { Scoreboard } from "./Scoreboard.js";
import { DelayAnimation, ScoreboardDisplay } from "./Configuration.js";
import Restful from "./Restful.js";
import { Database } from "./Database.js";
import "./InGameConfig.js";
import { getConfigMode, getConfiguration } from "./InGameConfig.js";

const Version = "1.7.1";
const TotalPlaytimeDB = new Database("TotalPlaytimeBS_DB");

let TPS = 0;
const playerPlaytime = {};
export const initialize = () => {
  system.runInterval(async () => {
    for (const player of world.getPlayers()) {
      if (player.hasTag("ignorescoreboard"))
        return player.onScreenDisplay.setTitle(" ");

      const ScoreboardData = getConfigMode()
        ? getConfiguration()
        : ScoreboardDisplay;

      const DateNow = new Date();
      const playTime = Date.now() - playerPlaytime[player.name];
      const totalPlayTime = TotalPlaytimeDB.get(player.name) ?? 0;
      const discord = player.getDynamicProperty("playerData");
      const placeHolder = {
        PlayerName: player.name,
        Discord: discord
          ? JSON.parse(discord)?.data?.discord_username ?? "§4Not Linked"
          : "§4Not Linked",
        PlayerHealth: Math.round(
          player.getComponent("minecraft:health").currentValue
        ),
        PlayerLevel: player.level,
        PlayerXP: player.getTotalXp(),
        PosX: Math.floor(player.location.x),
        PosY: Math.floor(player.location.y),
        PosZ: Math.floor(player.location.z),
        PlayerRanks:
          player.nameTag.substring(
            0,
            player.nameTag.length - (player.name.length + 1)
          ) || "None.",
        TotalPlayer: world.getAllPlayers().length,
        Gamemode: capitalize(player.getGameMode()),
        Dimension: capitalize(
          player.dimension.id.split(":")[1].replace("_", " ")
        ),
        Year: DateNow.getFullYear(),
        Month: DateNow.getMonth() + 1,
        Date: DateNow.getDate(),
        Hours: DateNow.getHours(),
        Minutes: DateNow.getMinutes(),
        Seconds: DateNow.getSeconds(),
        LocaleDate: `${DateNow.getDate()} ${
          [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ][DateNow.getMonth()]
        } ${DateNow.getFullYear()}`,
        LocaleTime: `${twoDigits(DateNow.getHours())}:${twoDigits(
          DateNow.getMinutes()
        )}`,
        WorldDay: world.getDay(),
        TimeOfDay: world.getTimeOfDay(),
        TPS: Math.floor(TPS),
        PlaytimeDays: Math.floor(playTime / 86400000),
        PlaytimeHours: Math.floor(playTime / 3600000) % 24,
        PlaytimeMinutes: Math.floor(playTime / 60000) % 60,
        PlaytimeSeconds: Math.floor(playTime / 1000) % 60,
        PlaytimeFormat: formatPlaytime(Math.floor(playTime / 1000)),
        TotalPlaytimeDays: Math.floor(totalPlayTime / 86400),
        TotalPlaytimeHours: Math.floor(totalPlayTime / 3600) % 24,
        TotalPlaytimeMinutes: Math.floor(totalPlayTime / 60) % 60,
        TotalPlaytimeSeconds: Math.floor(totalPlayTime) % 60,
        TotalPlaytimeFormat: formatPlaytime(Math.floor(totalPlayTime / 1000)),
        DeathsCount: getScoreboard(player, "deaths"),
        KillsCount: getScoreboard(player, "kills"),
        KillsPlayersCount: getScoreboard(player, "killsPlayers"),
      };
      let scoreBoard = new Scoreboard(ScoreboardData.UseBorder);
      let Title = ScoreboardData.Title;
      if (typeof Title === "object") {
        let newTitle = Title.filter((t) => t != undefined);
        const animatedTextIndex =
          Math.floor(Date.now() / (DelayAnimation * 1000)) % newTitle.length;
        Title = newTitle[animatedTextIndex];
      }
      scoreBoard.setTitle(
        Title,
        ScoreboardData.TitleCenter,
        ScoreboardData.TitleLogo
      );
      ScoreboardData.Field.forEach((field) => {
        if (typeof field === "object") {
          const animatedTextIndex =
            Math.floor(Date.now() / (DelayAnimation * 1000)) % field.length;
          field = field[animatedTextIndex];
        }
        Object.keys(placeHolder).forEach((pH) => {
          field = field.replaceAll(`{${pH}}`, placeHolder[pH]);
        });

        let ScoreboardRegex = /Scoreboard\((.*?)\)/g;
        let ScoreboardResult = [...field.matchAll(ScoreboardRegex)];
        ScoreboardResult.forEach((point) => {
          let text = point[0];
          let objectiveId = point[1];
          let score = getScoreboard(player, objectiveId);

          field = field.replace(text, score);
        });

        let CalculateNumberRegex = /CalculateNumber\((.*?)\)/g;
        let CalculateNumberResult = [...field.matchAll(CalculateNumberRegex)];
        CalculateNumberResult.forEach((point) => {
          let text = point[0];
          let number = point[1] ?? "0";
          try {
            let result = eval(number);
            field = field.replace(text, Number(result));
          } catch {
            field = field.replace(text, "Error calculate.");
          }
        });

        let FormatMoneyRegex = /FormatMoney\((.*?)\)/g;
        let FormatMoneyResult = [...field.matchAll(FormatMoneyRegex)];
        FormatMoneyResult.forEach((point) => {
          let text = point[0];
          let target = Number(point[1]) ?? 0;
          let money = target.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");

          field = field.replace(text, money);
        });

        let RomanNumeralRegex = /RomanNumeral\((.*?)\)/g;
        let RomanNumeralResult = [...field.matchAll(RomanNumeralRegex)];
        RomanNumeralResult.forEach((point) => {
          let text = point[0];
          let target = Number(point[1]) ?? 0;

          field = field.replace(text, toRomanNumeral(target));
        });

        let CapitalizeRegex = /Capitalize\((.*?)\)/g;
        let CapitalizeResult = [...field.matchAll(CapitalizeRegex)];
        CapitalizeResult.forEach((point) => {
          let text = point[0];
          let target = point[1] ?? "";

          field = field.replace(text, capitalize(target));
        });

        scoreBoard.addField(field);
      });

      scoreBoard.send(player);
    }
  }, 20);
};

const twoDigits = (n) => {
  return n > 9 ? "" + n : "0" + n;
};

const getScoreboard = (player, objectiveId) => {
  try {
    return world.scoreboard.getObjective(objectiveId).getScore(player) ?? 0;
  } catch (err) {
    return 0;
  }
};

const toRomanNumeral = (num) => {
  var lookup = {
      M: 1000,
      CM: 900,
      D: 500,
      CD: 400,
      C: 100,
      XC: 90,
      L: 50,
      XL: 40,
      X: 10,
      IX: 9,
      V: 5,
      IV: 4,
      I: 1,
    },
    roman = "",
    i;
  for (i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
};

let lastTick = Date.now();
let timeArray = [];

system.runInterval(() => {
  if (timeArray.length === 20) timeArray.shift();
  timeArray.push(Math.round((1000 / (Date.now() - lastTick)) * 100) / 100);
  TPS = timeArray.reduce((a, b) => a + b) / timeArray.length;
  lastTick = Date.now();
});

const capitalize = (string) => {
  let str = string.split(" ");
  let result = [];
  for (const s of str) {
    result.push(s[0].toUpperCase() + s.slice(1));
  }

  return result.join(" ");
};

const formatPlaytime = (seconds) => {
  let text = "";
  if (seconds >= 86400) {
    let day = Math.floor(seconds / 86400);
    text += `${day}d `;
    // message.push({ translate: "mce.command.playerlist.onlinefor.days", with: [`${day}`] }, { text: ", " })
  }
  if (seconds >= 3600) {
    let hour = Math.floor(seconds / 3600) % 24;
    text += `${hour}h `;
    // message.push({ translate: "mce.command.playerlist.onlinefor.hours", with: [`${hour % 24}`] }, { text: ", " })
  }
  if (seconds >= 60) {
    let minute = Math.floor(seconds / 60) % 60;
    text += `${minute}m `;
    // message.push({ translate: "mce.command.playerlist.onlinefor.minutes", with: [`${minute % 60}`] }, { text: ", " })
  }
  // let second = SecondPlayed
  text += `${seconds % 60}s`;
  // message.push({ translate: "mce.command.playerlist.onlinefor.seconds", with: [`${second % 60}`] })

  return text;
};

// PLAYTIME
const playerSpawned = {};
world.afterEvents.worldInitialize.subscribe(() => {
  world
    .getDimension("overworld")
    .runCommandAsync("scoreboard objectives add Mats dummy");
  world.getAllPlayers().forEach((p) => {
    playerPlaytime[p.name] = Date.now();
    playerSpawned[p.name] = true;
  });
});
world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) {
    playerPlaytime[player.name] = Date.now();
    if (!TotalPlaytimeDB.has(player.name)) TotalPlaytimeDB.set(player.name, 0);
    playerSpawned[player.name] = true;
  }
});
system.runInterval(() => {
  world
    .getAllPlayers()
    .filter((p) => playerSpawned[p.name])
    .forEach((player) => {
      let currentPlaytime = TotalPlaytimeDB.get(player.name) ?? 0;
      TotalPlaytimeDB.set(player.name, currentPlaytime + 1);
    });
}, 20);
world.afterEvents.playerLeave.subscribe(({ playerName }) => {
  delete playerPlaytime[playerName];
  delete playerSpawned[playerName];
});

// KILL & DEATH COUNTER
world.afterEvents.entityHurt.subscribe(({ hurtEntity, damageSource }) => {
  world
    .getDimension("overworld")
    .runCommandAsync("scoreboard objectives add deaths dummy")
    .catch((error) => {});
  world
    .getDimension("overworld")
    .runCommandAsync("scoreboard objectives add kills dummy")
    .catch((error) => {});
  world
    .getDimension("overworld")
    .runCommandAsync("scoreboard objectives add killsPlayers dummy")
    .catch((error) => {});
  const health = hurtEntity.getComponent("minecraft:health");
  if (health.currentValue > 0) return;
  if (hurtEntity instanceof Player)
    hurtEntity.runCommandAsync("scoreboard players add @s deaths 1");
  if (damageSource.damagingEntity instanceof Player)
    damageSource.damagingEntity.runCommandAsync(
      "scoreboard players add @s kills 1"
    );
  if (
    damageSource.damagingEntity instanceof Player &&
    hurtEntity instanceof Player
  )
    damageSource.damagingEntity.runCommandAsync(
      "scoreboard players add @s killsPlayers 1"
    );
});

// MISC
world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (source instanceof Player) {
    switch (itemStack.typeId) {
      case "betterscoreboard:configuration":
        return source.runCommand("scriptevent betterscoreboard:configuration");
    }
  }
});
Restful.listen("betterscoreboard-installed", () => {
  return { installed: true, version: Version };
});
