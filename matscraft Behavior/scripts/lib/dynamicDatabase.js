class UserData {
  constructor(player) {
    this.users = player.getDynamicProperty("playerData") || {}; // Ensure users is an object
    this.player = player;
  }

  insertUser(xuid) {
    if (!this.users[xuid]) {
      const data = {
        xuid,
        data: {
          is_linked: false,
          discord_id: null,
          discord_username: null,
        },
      };
      this.player.setDynamicProperty("playerData", data);
      return { message: `User ${xuid} has been added successfully.`, data };
    }
    return { message: `User ${xuid} already exists.` };
  }

  updateData(xuid, newData) {
    if (!this.users[xuid]) {
      throw new Error(`User with XUID ${xuid} not found!`);
    }
    this.users[xuid] = { ...this.users[xuid], ...newData }; // Merge old and new data
    return { message: `User ${xuid} has been updated successfully.` };
  }

  getData() {
    if (!this.users) {
      throw new Error("No Users Found!");
    }
    return {
      xuid: this.users.xuid,
      data: this.users.data,
    };
  }
}

export default UserData;
