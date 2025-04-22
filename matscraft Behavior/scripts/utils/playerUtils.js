export const getPlayerData = (player) => {
  const data = player.getDynamicProperty("playerData");
  if (!data) {
    const defaultData = {
      xuid: player.xuid,
      data: { is_linked: false, discord_id: null, discord_username: null },
    };
    player.setDynamicProperty("playerData", JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(data);
};

export const updatePlayerData = (player, playerData) => {
  player.setDynamicProperty("playerData", JSON.stringify(playerData));
};
