import { ModalFormData } from "@minecraft/server-ui";
import genSecret from "../lib/genSecret";
import { httpReq } from "../lib/httpReq";
import { variables } from "@minecraft/server-admin";
import { system, world } from "@minecraft/server";
import { showActionBar } from "../utils/player/index";
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
export const verifyCode = (player, code) => {
    system.run(async () => {
        try {
            const xuid = player.getDynamicProperty("xuid");
            const username = player.nameTag ? player.nameTag : player.name;
            const response = await httpReq({
                method: "get",
                url: `${variables.get("BASE_URL")}/${xuid}/login?auth_tokens=${code}&minecraft_username=${username}`,
                headers: {
                    "matscraft-secret": genSecret(),
                },
            });
            const body = JSON.parse(response.body);
            console.log(`Status: ${response.status}, Response: ${JSON.stringify(body)}`);
            if (response.status === 200) {
                const { mats, huh, discord_id, discord_username } = body;
                player.setDynamicProperty("is_linked", true);
                player.setDynamicProperty("discord_id", discord_id);
                player.setDynamicProperty("discord_username", discord_username);
                world.scoreboard
                    .getObjective("Mats")
                    ?.setScore(player.scoreboardIdentity, mats);
                world.scoreboard
                    .getObjective("Huh")
                    ?.setScore(player.scoreboardIdentity, huh);
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
    });
};
export default auth;
