import { ActionFormData } from "@minecraft/server-ui";
import { getPlayerScore, getPlayerData, updatePlayerData, setPlayerScore, } from "../utils/playerUtils";
import { showShop } from "./shop";
import httpReq from "../lib/httpReq";
import genSecret from "../lib/genSecret";
import CONFIG from "../config/config";
const showDashboard = async (player) => {
    const playerScore = await getPlayerScore(player, "Mats");
    const playerData = getPlayerData(player);
    const form = new ActionFormData().title("MATSCRAFT");
    form
        .body(`§lName: §l§r§2${player.name}\n§r§lDiscord: §r§9${playerData.data.discord_username}\n§r§lMats: §l§r§e${formatNumber(playerScore)}`)
        .button("Rewards", "textures/ui/promo_holiday_gift_small")
        .button("D", "")
        .button("Shop", "textures/ui/hammer_l")
        .button("Logout", "textures/custom_ui/logout");
    form.show(player).then(async (res) => {
        if (res.canceled)
            return;
        if (res.selection === 2) {
            showShop(player);
        }
        if (res.selection === 3) {
            const playerData = getPlayerData(player);
            const minecraft_id = playerData.xuid;
            if (minecraft_id) {
                const response = await httpReq.request({
                    method: "DELETE",
                    url: `${CONFIG.LOGOUT}/${minecraft_id}/logout`,
                    headers: {
                        "Content-Type": "application/json",
                        "matscraft-secret": genSecret(),
                    },
                });
                console.log(`Status: ${response.status}, Response: ${response.body}`);
                if (response.status === 200) {
                    setPlayerScore(player, "Mats", 0);
                    setPlayerScore(player, "Huh", 0);
                    updatePlayerData(player, "is_linked", false);
                    updatePlayerData(player, "discord_id", null);
                    updatePlayerData(player, "discord_username", null);
                }
            }
        }
    });
};
function formatNumber(input) {
    let num = Number(input);
    if (isNaN(num)) {
        return "Invalid number";
    }
    if (num >= 100_000) {
        return (num / 1_000).toFixed(0) + "K";
    }
    else {
        return num.toLocaleString("en-US");
    }
}
export default showDashboard;
