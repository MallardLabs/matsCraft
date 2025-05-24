import { Player, system, world } from "@minecraft/server";
import DynamicDatabase from "./DynamicDatabase";
const DefaultConfiguration = {
    Title: [">> §4Better §fScoreboard §r<<", "> §4Better §fScoreboard §r<"],
    TitleLogo: true,
    TitleCenter: true,
    UseBorder: true,
    Field: [
        "§eName: §r{PlayerName}",
        "§eHealth: §4{PlayerHealth}",
        "§eLevel: §r{PlayerLevel}",
        "§eXP: §r{PlayerXP}",
        "§eMoney: §rFormatMoney(Scoreboard(Money))",
        "§ePosition: §r{PosX} | {PosY} | {PosZ}",
        "§eGamemode: §r{Gamemode}",
        "§eDimension: §r{Dimension}",
        "§eOnline: §r{TotalPlayer} / 20",
        "§eTPS: §r{TPS}",
        "§eDate: §r{LocaleTime} | {LocaleDate}",
        "§ePlaytime: §r{TotalPlaytimeDays}d {TotalPlaytimeHours}h {TotalPlaytimeMinutes}m {TotalPlaytimeSeconds}s",
    ],
};
const Database = new DynamicDatabase("ScoreboardConfiguration");
world.afterEvents.worldInitialize.subscribe(() => {
    if (!Database.has("TitleConfiguration"))
        Database.set("TitleConfiguration", {
            Title: DefaultConfiguration.Title,
            TitleLogo: DefaultConfiguration.TitleLogo,
            TitleCenter: DefaultConfiguration.TitleCenter,
        });
    if (!Database.has("BorderConfiguration"))
        Database.set("BorderConfiguration", {
            UseBorder: DefaultConfiguration.UseBorder,
        });
    if (!Database.has("FieldsConfiguration"))
        Database.set("FieldsConfiguration", {
            Field: DefaultConfiguration.Field,
        });
    if (!Database.has("ConfigMode"))
        Database.set("ConfigMode", false);
});
const getTitleConfiguration = () => Database.get("TitleConfiguration");
const setTitleConfiguration = (data) => Database.set("TitleConfiguration", data);
const getBorderConfiguration = () => Database.get("BorderConfiguration");
const setBorderConfiguration = (data) => Database.set("BorderConfiguration", data);
const getFieldsConfiguration = () => Database.get("FieldsConfiguration");
const setFieldsConfiguration = (data) => Database.set("FieldsConfiguration", data);
const getConfigMode = () => Database.get("ConfigMode");
const setConfigMode = (data) => Database.set("ConfigMode", data);
const getConfiguration = () => {
    return {
        ...getTitleConfiguration(),
        ...getBorderConfiguration(),
        ...getFieldsConfiguration(),
    };
};
system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity: player }) => {
    if (player instanceof Player && id === "betterscoreboard:configuration") {
        showConfigurationUI(player);
    }
}, { namespaces: ["betterscoreboard"] });
const showConfigurationUI = (player) => {
    // Configuration UI logic (not implemented here for brevity)
};
export { getTitleConfiguration, setTitleConfiguration, getBorderConfiguration, setBorderConfiguration, getFieldsConfiguration, setFieldsConfiguration, getConfigMode, setConfigMode, getConfiguration };
