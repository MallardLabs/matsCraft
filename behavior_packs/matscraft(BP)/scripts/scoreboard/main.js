import { world, Player, system, } from "@minecraft/server";
import { Scoreboard } from "./Scoreboard.js";
import { DelayAnimation, ScoreboardDisplay } from "./Configuration";
import Restful from "./Restful.js";
import { Database } from "./Database.js";
import { getConfigMode, getConfiguration } from "./InGameConfig";
const Version = "1.7.1";
const TotalPlaytimeDB = new Database("TotalPlaytimeBS_DB");
let TPS = 0;
const playerPlaytime = {};
const playerSpawned = {};
export const initialize = () => {
    system.runInterval(() => {
        for (const player of world.getPlayers()) {
            if (player.hasTag("ignorescoreboard")) {
                player.onScreenDisplay.setTitle(" ");
                continue;
            }
            const ScoreboardData = getConfigMode()
                ? getConfiguration()
                : ScoreboardDisplay;
            const DateNow = new Date();
            const playTime = Date.now() - (playerPlaytime[player.name] ?? Date.now());
            const totalPlayTime = TotalPlaytimeDB.get(player.name) ?? 0;
            const discordRaw = player.getDynamicProperty("discord_username");
            const discord = discordRaw
                ? discordRaw ?? "§4Not Linked"
                : "§4Not Linked";
            const placeHolder = {
                PlayerName: player.name,
                Discord: discord,
                PlayerHealth: Math.round(player.getComponent("minecraft:health")?.currentValue ?? 0),
                PlayerLevel: player.level,
                PlayerXP: player.getTotalXp(),
                PosX: Math.floor(player.location.x),
                PosY: Math.floor(player.location.y),
                PosZ: Math.floor(player.location.z),
                PlayerRanks: player.nameTag.substring(0, player.nameTag.length - (player.name.length + 1)) || "None.",
                TotalPlayer: world.getAllPlayers().length,
                Gamemode: capitalize(player.getGameMode()),
                Dimension: capitalize(player.dimension.id.split(":")[1].replace("_", " ")),
                Year: DateNow.getFullYear(),
                Month: DateNow.getMonth() + 1,
                Date: DateNow.getDate(),
                Hours: DateNow.getHours(),
                Minutes: DateNow.getMinutes(),
                Seconds: DateNow.getSeconds(),
                LocaleDate: `${DateNow.getDate()} ${[
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
                ][DateNow.getMonth()]} ${DateNow.getFullYear()}`,
                LocaleTime: `${twoDigits(DateNow.getHours())}:${twoDigits(DateNow.getMinutes())}`,
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
            const scoreBoard = new Scoreboard(ScoreboardData.UseBorder);
            let Title = ScoreboardData.Title;
            if (Array.isArray(Title)) {
                const newTitle = Title.filter((t) => t !== undefined);
                const animatedTextIndex = Math.floor(Date.now() / (DelayAnimation * 1000)) % newTitle.length;
                Title = newTitle[animatedTextIndex];
            }
            scoreBoard.setTitle(Title, ScoreboardData.TitleCenter, ScoreboardData.TitleLogo);
            ScoreboardData.Field.forEach((f) => {
                let field = Array.isArray(f)
                    ? f[Math.floor(Date.now() / (DelayAnimation * 1000)) % f.length]
                    : f;
                if (typeof field !== "string")
                    return;
                Object.keys(placeHolder).forEach((key) => {
                    field = field.replaceAll(`{${key}}`, String(placeHolder[key]));
                });
                field = field.replace(/Scoreboard\((.*?)\)/g, (_, obj) => String(getScoreboard(player, obj)));
                field = field.replace(/CalculateNumber\((.*?)\)/g, (_, expr) => {
                    try {
                        return String(eval(expr));
                    }
                    catch {
                        return "Error calculate.";
                    }
                });
                field = field.replace(/FormatMoney\((.*?)\)/g, (_, num) => {
                    const value = Number(num) || 0;
                    const formatted = value
                        .toFixed(2)
                        .replace(/\d(?=(\d{3})+\.)/g, "$&,");
                    return formatted.endsWith(".00")
                        ? formatted.slice(0, -3)
                        : formatted;
                });
                field = field.replace(/RomanNumeral\((.*?)\)/g, (_, num) => toRomanNumeral(Number(num) || 0));
                field = field.replace(/Capitalize\((.*?)\)/g, (_, str) => capitalize(str));
                scoreBoard.addField(field);
            });
            scoreBoard.send(player);
        }
    }, 20);
};
const twoDigits = (n) => (n > 9 ? `${n}` : `0${n}`);
const getScoreboard = (player, objectiveId) => {
    try {
        return world.scoreboard.getObjective(objectiveId)?.getScore(player) ?? 0;
    }
    catch {
        return 0;
    }
};
const toRomanNumeral = (num) => {
    const lookup = {
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
    };
    let roman = "";
    for (const i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }
    return roman;
};
const formatPlaytime = (seconds) => {
    let text = "";
    if (seconds >= 86400)
        text += `${Math.floor(seconds / 86400)}d `;
    if (seconds >= 3600)
        text += `${Math.floor(seconds / 3600) % 24}h `;
    if (seconds >= 60)
        text += `${Math.floor(seconds / 60) % 60}m `;
    return text + `${seconds % 60}s`;
};
system.runInterval(() => {
    const now = Date.now();
    const tick = 1000 / (now - lastTick);
    TPS = (TPS * 19 + tick) / 20;
    lastTick = now;
}, 50);
let lastTick = Date.now();
world.afterEvents.worldInitialize.subscribe(() => {
    world
        .getDimension("overworld")
        .runCommand("scoreboard objectives add Mats dummy");
    world
        .getDimension("overworld")
        .runCommand("scoreboard objectives add Huh dummy");
    for (const p of world.getAllPlayers()) {
        playerPlaytime[p.name] = Date.now();
        playerSpawned[p.name] = true;
    }
});
world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (initialSpawn) {
        playerPlaytime[player.name] = Date.now();
        if (!TotalPlaytimeDB.has(player.name))
            TotalPlaytimeDB.set(player.name, 0);
        playerSpawned[player.name] = true;
    }
});
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        if (!playerSpawned[player.name])
            continue;
        const current = TotalPlaytimeDB.get(player.name) ?? 0;
        TotalPlaytimeDB.set(player.name, current + 1);
    }
}, 20);
world.afterEvents.playerLeave.subscribe(({ playerName }) => {
    delete playerPlaytime[playerName];
    delete playerSpawned[playerName];
});
world.afterEvents.entityHurt.subscribe(({ hurtEntity, damageSource }) => {
    const source = damageSource;
    const overworld = world.getDimension("overworld");
    overworld.runCommand("scoreboard objectives add deaths dummy");
    overworld.runCommand("scoreboard objectives add kills dummy");
    overworld.runCommand("scoreboard objectives add killsPlayers dummy");
    const health = hurtEntity.getComponent("minecraft:health");
    if (!health || health.currentValue > 0)
        return;
    if (hurtEntity instanceof Player)
        hurtEntity.runCommand("scoreboard players add @s deaths 1");
    if (source.damagingEntity instanceof Player)
        source.damagingEntity.runCommand("scoreboard players add @s kills 1");
    if (source.damagingEntity instanceof Player && hurtEntity instanceof Player)
        source.damagingEntity.runCommand("scoreboard players add @s killsPlayers 1");
});
world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
    if (source instanceof Player &&
        itemStack.typeId === "betterscoreboard:configuration") {
        source.runCommand("scriptevent betterscoreboard:configuration");
    }
});
Restful.listen("betterscoreboard-installed", () => ({
    installed: true,
    version: Version,
}));
function capitalize(str) {
    return str
        .split(" ")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
}
