import { ModalFormData } from "@minecraft/server-ui";
import CONFIG from "../config/config";
import httpReq from "../lib/httpReq";
import { showActionBar, setPlayerScore, getPlayerData, updatePlayerData, } from "../utils/playerUtils";
import genSecret from "../lib/genSecret";
const auth = (player, title = "§eVerification Code") => {
    const form = new ModalFormData()
        .title(title)
        .textField("", "xxx-xxx")
        .dropdown("§oTips: Get code from", [
        "Nexus Bot",
        "https://mallardlabs.xyz",
    ]);
    form.show(player).then((res) => {
        if (res.canceled)
            return;
        const code = res.formValues[0];
        verifyCode(player, code);
    });
};
export const verifyCode = async (player, code) => {
    try {
        const playerData = getPlayerData(player);
        const response = await httpReq.request({
            method: "POST",
            url: CONFIG.AUTH,
            body: JSON.stringify({
                minecraft_id: playerData.xuid,
                minecraft_username: player.nameTag ? player.nameTag : player.name,
                token: code,
            }),
            headers: {
                "Content-Type": "application/json",
                matscraft_token: genSecret(),
            },
        });
        const body = JSON.parse(response.body);
        console.log(`Status: ${response.status}, Response: ${JSON.stringify(body)}`);
        if (response.status === 200) {
            playerData.data.is_linked = true;
            playerData.data.discord_id = body.discord_id;
            playerData.data.discord_username = body.discord_username;
            updatePlayerData(player, playerData);
            setPlayerScore(player, "Mats", body.balance);
            showActionBar(player, "§aAccount Linked Successfully!");
        }
        else {
            showActionBar(player, `§c${body.message}`);
            auth(player, "§cInvalid Token!");
        }
    }
    catch (error) {
        console.error(`Verification failed: ${error.message}`);
        showActionBar(player, "§cVerification Error");
    }
};
export default auth;
