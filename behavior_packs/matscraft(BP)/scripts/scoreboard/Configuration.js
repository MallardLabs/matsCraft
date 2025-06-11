const ScoreboardDisplay = {
    Title: [
        "§eMatsCraft",
        "§cMatsCraft",
        "§bMatsCraft",
        "§dMatsCraft",
        "§aMatsCraft",
        "§fMatsCraft",
    ],
    TitleLogo: true,
    TitleCenter: true,
    UseBorder: true,
    Field: [
        "§eName: §r{PlayerName}",
        "§eDiscord: §r{Discord}",
        "§eLevel: §r{PlayerLevel}",
        "§eXP: §r{PlayerXP}",
        "§eMats: §r FormatMoney(Scoreboard(Mats))",
        "§eHuh: §r FormatMoney(Scoreboard(Huh))",
        "§eOnline: §r{TotalPlayer} / 1000",
    ],
};
const DelayAnimation = 1;
export { ScoreboardDisplay, DelayAnimation };
