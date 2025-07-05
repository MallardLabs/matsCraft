import { system, world } from "@minecraft/server";
/**
 * Displays a message in the action bar of the specified player and plays a sound effect.
 *
 * @param {Player} player - The player to whom the action bar message and sound will be sent.
 * @param {string} message - The message to display in the action bar.
 */
export const showActionBar = (player, message) => {
    player.runCommand("playsound random.pop @s");
    player.runCommand(`title @s actionbar ${message}`);
};
/**
 * Retrieves detailed data about a specific player.
 *
 * @param {Player} player - The player object for which to retrieve data.
 * @returns {Object} An object containing the player's data.
 * @returns {string|null} [returns.xuid] - The xuid of the player or null if not available.
 * @returns {Object} [returns.data] - Additional metadata related to the player's account.
 * @returns {boolean} [returns.data.is_linked] - Indicates whether the player is linked to an external account.
 * @returns {string|null} [returns.data.discord_id] - The Discord ID of the player or null if not set.
 * @returns {string|null} [returns.data.discord_username] - The Discord username of the player or null if not set.
 */
export const getPlayerData = (player) => {
    const xuid = player.getDynamicProperty("xuid");
    const discord_id = player.getDynamicProperty("discord_id");
    const discord_username = player.getDynamicProperty("discord_username");
    const is_linked = !!player.getDynamicProperty("is_linked");
    return {
        xuid: xuid ?? null,
        data: {
            is_linked,
            discord_id: discord_id ?? null,
            discord_username: discord_username ?? null,
        },
    };
};
/**
 * Updates a dynamic property for a specified player with the given key and value.
 *
 * @param {Player} player - The player entity whose dynamic property will be updated.
 * @param {string} key - The key identifying the dynamic property to be updated or added.
 * @param {string | boolean} value - The value to be assigned to the dynamic property. Can be a string or a boolean.
 */
export const setPlayerData = (player, key, value) => {
    system.run(() => {
        player.setDynamicProperty(key, value);
    });
};
/**
 * Fetches the score of a given player for a specified objective.
 *
 * @param {Player} player - The player whose score is to be retrieved.
 * @param {string} objectiveName - The name of the scoreboard objective.
 * @returns {number} The score of the player for the given objective. Returns 0 if the objective or player's identity is unavailable, or if the score is not a valid number.
 */
export const getPlayerScore = (player, objectiveName) => {
    const objective = world.scoreboard.getObjective(objectiveName);
    const identity = player.scoreboardIdentity;
    if (!objective || !identity)
        return 0;
    const score = objective.getScore(identity);
    return typeof score === "number" ? score : 0;
};
/**
 * Sets the score of a specified player for a specific scoreboard objective.
 *
 * @param {Player} player - The player whose score is to be updated.
 * @param {string} objectiveName - The name of the scoreboard objective.
 * @param {number} score - The score to set for the player in the specified objective.
 * @returns {void}
 */
export const setPlayerScore = (player, objectiveName, score) => {
    const objective = world.scoreboard.getObjective(objectiveName);
    if (!objective)
        return;
    system.run(() => {
        objective.setScore(player, score);
    });
};
export const addPlayerScore = (player, objectiveName, value) => {
    const current = getPlayerScore(player, objectiveName);
    setPlayerScore(player, objectiveName, current + value);
};
export const giveItem = (player, itemId, amount = 1) => {
    player.runCommand(`give @s ${itemId} ${amount}`);
};
