/**
 AVAILABLE PLACEHOLDER
 * {PlayerName} = Player Name
 * {PlayerHealth} = Player Health
 * {PlayerLevel} = Player Level
 * {PlayerXP} = Player Total Experience
 * {PosX}, {PosY}, {PosZ} = Player Position
 * {PlayerRanks} = Player Ranks, works for Minecraft Essentials Ranks (https://mcpedl.com/minecraft-essentials/)
 * {Gamemode} = Player Gamemode (Creative, Survival, Adventure, Spectator)
 * {Dimension} = Player Dimension (Overworld, Nether, The End)
 * {TotalPlayer} = Total Online Player
 * {Year} = Get Year in Real Time
 * {Month} = Get Month in Real Time
 * {Date} = Get Date in Real Time
 * {Hours} = Get Hour in Real Time
 * {Minutes} = Get Minute in Real Time
 * {Seconds} = Get Second in Real Time
 * {LocaleDate} = Get Formated Date
 * {LocaleTime} = Get Formated Time
 * {WorldDay} = Get World Day
 * {TimeOfDay} = Get Time of Day in ticks
 * {PlaytimeDays}: Get Player Playtime in Days
 * {PlaytimeHours}: Get Player Playtime in Hours
 * {PlaytimeMinutes}: Get Player Playtime in Minutes
 * {PlaytimeSeconds}: Get Player Playtime in Seconds
 * {PlaytimeFormat}: Get Formated Player Playtime
 * {TotalPlaytimeDays}: Get Player Total Playtime in Days
 * {TotalPlaytimeHours}: Get Player Total Playtime in Hours
 * {TotalPlaytimeMinutes}: Get Player Total Playtime in Minutes
 * {TotalPlaytimeSeconds}: Get Player Total Playtime in Seconds
 * {TotalPlaytimeFormat}: Get Formated Total Player Playtime
 * {DeathsCount}: Get Player Death Count
 * {KillsCount}: Get Player Kill Count
 * {KillsPlayersCount}: Get Player Kill Count (Player kills player)
 * Scoreboard(objectiveId) = Get player score in Scoreboard Objective
 * FormatMoney(Number) = Format number to Money text
 * CalculateNumber(Math) = Example: CalculateNumber(500 / 50)
 * RomanNumeral(Number) = Format number to Roman, Example 5 -> V
 * Capitalize(String) = Format Capitalize on String, Example Capitalize(paoeni) -> Paoeni
*/
const ScoreboardDisplay = {
  // You can setting the scoreboard here! || Use Array on Title or Field for Animate Text
  Title: [
    "§eMatsCraft",
    "§cMatsCraft",
    "§bMatsCraft",
    "§dMatsCraft",
    "§aMatsCraft",
    "§fMatsCraft",
  ],
  TitleLogo: true, // Use logo on title, if set true title will replace with logo
  TitleCenter: true, // Set false if you don't want title set to Center
  UseBorder: true, // Set false will make background transparent
  Field: [
    "§eName: §r{PlayerName}",
    "§eDiscord: §r{Discord}",
    "§eLevel: §r{PlayerLevel}",
    "§eXP: §r{PlayerXP}",
    "§eMats: §rFormatMoney(Scoreboard(Mats))",
    "§eOnline: §r{TotalPlayer} / 20",
  ],
};

const DelayAnimation = 1; // In Seconds

export { ScoreboardDisplay, DelayAnimation };
