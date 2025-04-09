import {
  ActionFormData,
  ModalFormData,
  MessageFormData,
} from "@minecraft/server-ui";
import { world } from "@minecraft/server";
import { httpReq } from "../lib/httpReq";
import { config } from "../config";

const getPlayerScore = (player, objectiveName) => {
  const objective = world.scoreboard.getObjective(objectiveName) || null;
  return objective ? objective.getScore(player.scoreboardIdentity) || 0 : 0;
};

export const showMainMenu = (player) => {
  const playerData = JSON.parse(player.getDynamicProperty("playerData"));
  return playerData.data.is_linked ? dashboard(player) : home(player);
};

const home = (player) => {
  const form = new MessageFormData()
    .title("MatsCraft Portal")
    .body(
      "You must link your Discord account to play. Progress won't be saved without linking."
    )
    .button1("Explore Without Linking")
    .button2("Link Account");

  form.show(player).then((res) => {
    if (res.selection === 1) linkAccount(player);
  });
};

const dashboard = (player) => {
  const playerScore = getPlayerScore(player, "Mats");
  const form = new ActionFormData()
    .title("MatsCraft Dashboard")
    .body("\n")
    .button("Deposit Mats")
    .button("Withdraw Mats")
    .button("§cDisconnect Discord");

  form.show(player).then((res) => {
    if (res.canceled) return;

    switch (res.selection) {
      case 0:
        showDepositForm(player);
        break;
      case 1:
        showWithdrawForm(player, playerScore);
        break;
      case 2:
        disconnectDiscord(player);
        break;
    }
  });
};

const showDepositForm = (player) => {
  const form = new ModalFormData()
    .title("Deposit Mats")
    .slider("Amount to Deposit:", 0, 255, 1, 0); // Slider from 0 to 255, default 0

  form.show(player).then((res) => {
    if (res.canceled) return;
    const amount = res.formValues[0];
    player.sendMessage(`matscraft deposit ${amount}`);
  });
};

const showWithdrawForm = (player, playerScore) => {
  const form = new ModalFormData()
    .title("Withdraw Mats")
    .slider(
      `Your Balance: §e${playerScore} §fMats\nWithdraw Amount`,
      0,
      playerScore,
      1,
      0
    );

  form.show(player).then((res) => {
    if (res.canceled) return;
    const amount = res.formValues[0];
    player.runCommand(`scoreboard players set @s Mats ${playerScore - amount}`);
    player.runCommand(
      `title @s actionbar §aYour withdraw ${amount}x Mats has been processed!`
    );
  });
};

const disconnectDiscord = (player) => {
  player.runCommand("say Disconnecting Discord..."); // Placeholder; replace with actual command
  const playerData = JSON.parse(player.getDynamicProperty("playerData"));
  playerData.data.is_linked = false;
  playerData.data.discord_id = null;
  playerData.data.discord_username = null;
  player.setDynamicProperty("playerData", JSON.stringify(playerData));
  // player.runCommand("matscraft discord disconnect");
};

const linkAccount = (player, title = "§eVerification Code") => {
  const form = new ModalFormData()
    .title(title)
    .textField("", "xxx-xxx")
    .dropdown("§oTips: Get code from", [
      "Nexus Bot",
      "https://mallardlabs.xyz",
    ]);

  form.show(player).then((res) => {
    if (res.canceled) return;
    const code = res.formValues[0];
    verifyCode(player, code);
  });
};

const verifyCode = async (player, code) => {
  try {
    const playerData = JSON.parse(player.getDynamicProperty("playerData"));
    const response = await httpReq.request({
      method: "POST",
      url: `${config.BASE_URL}/api/matscraft/auth`,
      body: JSON.stringify({
        xuid: playerData.xuid,
        token: code,
        username: player.nameTag,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const body = JSON.parse(response.body);
    console.log(
      `Status: ${response.status}, Response: ${JSON.stringify(body)}`
    );

    if (response.status === 200) {
      playerData.data.is_linked = true;
      playerData.data.discord_id = body.discord_id;
      playerData.data.discord_username = body.discord_username;
      player.setDynamicProperty("playerData", JSON.stringify(playerData));
      player.runCommand(`title @s actionbar §aAccount Linked Successfully!`);
      player.runCommand(`scoreboard players set @s Mats ${body.balance}`);
    } else {
      player.runCommand(`title @s actionbar §c${body.message}`);
      linkAccount(player, "§cInvalid Token!");
    }
  } catch (error) {
    console.error(`Verification failed: ${error.message}`);
    player.runCommand(`title @s actionbar §cVerification Error`);
  }
};
