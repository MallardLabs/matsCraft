import itemPickup from "../events/itemPickup";
import httpReq from "../lib/httpReq";
import { getPlayerData, showActionBar, setPlayerScore, getPlayerScore, } from "../utils/playerUtils";
import CONFIG from "../config/config";
import genSecret from "../lib/genSecret";
import { world } from "@minecraft/server";
itemPickup.listen(async (data, actions) => {
    const { typeId, amount, player } = data;
    const playerData = getPlayerData(player);
    if (!playerData) {
        if (typeId === "matsphone:matsphone")
            return;
        actions.remove();
        showActionBar(player, "§cYour account is not linked! Please link your account first!");
        return;
    }
    if (typeId !== "matscraft:mats")
        return;
    const now = Math.floor(Date.now() / 1000);
    const pendingUpdates = getPendingUpdate();
    const discordId = playerData.data.discord_id;
    // Find pending entry player for pending update
    let entry = pendingUpdates.find((u) => u.discord_id === discordId);
    // If no entry found, create a new one
    if (!entry) {
        entry = {
            discord_id: discordId,
            username: playerData.username,
            total_amount: 0,
            last_update: now + 20,
        };
        pendingUpdates.push(entry);
    }
    // add amount to entry
    entry.total_amount += amount;
    // update player score locally
    const currentScore = getPlayerScore(player, "Mats");
    setPlayerScore(player, "Mats", currentScore + amount);
    showActionBar(player, `+${amount} Mats`);
    actions.remove();
    // if last update is more than 20 seconds, update to server and update player balance locally also on server as well
    if (entry.last_update <= now && entry.total_amount > 0) {
        const response = await httpReq.request({
            method: "POST",
            url: CONFIG.UPDATE_BALANCE,
            headers: {
                "Content-Type": "application/json",
                matscraft_token: genSecret(),
            },
            body: JSON.stringify({
                discord_id: entry.discord_id,
                amount: entry.total_amount,
            }),
        });
        // if success, update player balance
        if (response.status === 200) {
            const body = JSON.parse(response.body);
            setPlayerScore(player, "Mats", body.balance);
            entry.total_amount = 0;
            entry.last_update = now + 20;
        }
        else {
            console.warn("[DEBUG] Failed to update to server: ", response.body);
        }
    }
    updatePendingUpdate(pendingUpdates);
}, 20);
const getPendingUpdate = () => {
    const raw = world.getDynamicProperty("pendingItemUpdate");
    if (raw) {
        try {
            return JSON.parse(raw);
        }
        catch {
            console.warn("Invalid pendingItemUpdate data format.");
        }
    }
    return [];
};
const updatePendingUpdate = (data) => {
    world.setDynamicProperty("pendingItemUpdate", JSON.stringify(data));
};
