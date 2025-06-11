import { ModalFormData } from "@minecraft/server-ui";
import CONFIG from "../config/config";
import httpReq from "../lib/httpReq";
import { showActionBar, setPlayerScore, getPlayerData, updatePlayerData, } from "../utils/playerUtils";
import genSecret from "../lib/genSecret";
const auth = (player, title = "§lVerification Code") => {
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
        const xuid = playerData.xuid;
        const username = player.nameTag ? player.nameTag : player.name;
        const response = await httpReq.request({
            method: "GET",
            url: `${CONFIG.AUTH}/${playerData.xuid}/login?auth_tokens=${code}&minecraft_username=${username}`,
            headers: {
                "matscraft-secret": genSecret(),
            },
        });
        const body = JSON.parse(response.body);
        console.log(`Status: ${response.status}, Response: ${JSON.stringify(body)}`);
        if (response.status === 200) {
            const { mats, huh, discord_id, discord_username } = body.data;
            updatePlayerData(player, "is_linked", true);
            updatePlayerData(player, "discord_id", discord_id);
            updatePlayerData(player, "discord_username", discord_username);
            setPlayerScore(player, "Mats", mats);
            setPlayerScore(player, "Huh", huh);
            showActionBar(player, "§aAccount Linked Successfully!");
            console.log(`[Linked] ${player.nameTag} | is_linked: true | discord_id: ${discord_id} | discord_username: ${discord_username} | Mats: ${mats} | Huh: ${huh}`);
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
