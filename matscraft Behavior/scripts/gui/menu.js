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
  console.log(player.getDynamicProperty("playerData"));
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
    .button("Shop")
    // .button("Withdraw Mats")
    .button("§cDisconnect Discord");

  form.show(player).then((res) => {
    if (res.canceled) return;

    switch (res.selection) {
      case 0:
        shop(player);
        break;
      case 1:
        disconnectDiscord(player);
        break;
    }
  });
};

const shop = (player) => {
  let form = new ActionFormData();
  form.title("Shop");
  form.button("Nando Pickaxe", "textures/items/pickaxe/nando.png");
  form.button("lowpolyduck Pickaxe", "textures/items/pickaxe/lowpolyduck.png");
  form.button("Mezo Pickaxe", "textures/items/pickaxe/mezo.png");

  form.show(player).then((res) => {
    if (res.canceled) return;
    switch (res.selection) {
      case 0:
        buyPickaxe(player, {
          id: "matscraft:nando_pickaxe",
          name: "Nando Pickaxe",
          cost: 50,
          message:
            "§lItem Name§r: Nando Pickaxe\n§lCost: §r50 Mats\n\n§lAbility\n§rBy Using Nando Pickaxe, you can get mats drops from common,uncommon blocks",
        });
        break;
      case 1:
        buyPickaxe(player, {
          id: "matscraft:lowpolyduck_pickaxe",
          name: "lowpolyduck Pickaxe",
          cost: 150,
          message:
            "§lItem Name§r: lowpolyduck Pickaxe\n§lCost: §r100 Mats\n\n§lAbility:\n§rBy Using lowpolyduck Pickaxe, you can get mats drops from common,uncommon,rare,epic blocks",
        });
        break;
      case 2:
        buyPickaxe(player, {
          id: "matscraft:mezo_pickaxe",
          name: "Mezo Pickaxe",
          cost: 200,
          message:
            "§lItem Name§r: Mezo Pickaxe\n§lCost: §r200 Mats\n\n§lAbility:\n§rBy Using Mezo Pickaxe, you can get mats drops from common,uncommon,rare,epic,legendary blocks",
        });
        break;
    }
  });
};

const buyPickaxe = (player, data) => {
  const balance = getPlayerScore(player, "Mats");
  const playerData = JSON.parse(player.getDynamicProperty("playerData"));
  let form = new MessageFormData();
  form.title(`Buy ${data.name}?`);
  form.body(data.message);
  form.button1("Cancel");
  form.button2(balance >= data.cost ? "§2Buy" : "§cNot Enough Mats");
  form.show(player).then(async (res) => {
    if (res.selection === 1) {
      const balance = getPlayerScore(player, "Mats");
      if (balance >= data.cost) {
        const response = await httpReq.request({
          method: "PUT",
          url: `${config.ENDPOINTS.UPDATE_BALANCE}`,
          body: JSON.stringify({
            discord_id: playerData.data.discord_id,
            amount: -data.cost,
          }),
          headers: { "Content-Type": "application/json" },
        });
        if (response.status === 200) {
          const body = JSON.parse(response.body);
          player.runCommand(`scoreboard players set @s Mats ${body.balance}`);
          player.runCommand(
            `title @s actionbar §a${data.name} Purchased Successfully!`
          );
          player.runCommand(`give @s ${data.id} 1`);
        }
      } else {
        player.runCommand(`title @s actionbar §cNot Enough Mats!`);
      }
    }
  });
};
const disconnectDiscord = async (player) => {
  player.runCommand("say Disconnecting Discord...");
  const playerData = JSON.parse(player.getDynamicProperty("playerData"));
  const response = await httpReq.request({
    method: "POST",
    url: `${config.ENDPOINTS.LOGOUT}`,
    body: JSON.stringify({
      minecraft_id: playerData.xuid,
    }),
    headers: { "Content-Type": "application/json" },
  });
  playerData.data.is_linked = false;
  playerData.data.discord_id = null;
  playerData.data.discord_username = null;
  player.setDynamicProperty("playerData", JSON.stringify(playerData));
  player.runCommand("scoreboard players set @s Mats 0");
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
      url: `${config.ENDPOINTS.AUTH}`,
      body: JSON.stringify({
        minecraft_id: playerData.xuid,
        minecraft_username: player.nameTag,
        token: code,
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
