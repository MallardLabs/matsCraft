import { world, system, ScoreboardObjective } from "@minecraft/server";
import { updateBalance } from "../services/balanceService.js";
export class ItemPickup {
  constructor(identifier, ticks, scoreboardName) {
    this.identifier = identifier;
    this.ticks = ticks;
    this.scoreboardName = scoreboardName;
    this.playerInventories = new Map();
    this.monitoredItems = [identifier];
  }

  initialize() {
    system.runInterval(() => this.trackItemPickups(), this.ticks);
  }

  trackItemPickups() {
    const activePlayers = world
      .getPlayers()
      .filter((player) => player.hasComponent("minecraft:inventory"));

    activePlayers.forEach((player) => {
      const inventory = this.getPlayerInventory(player);
      const currentInventory = this.getCurrentInventory(inventory);
      const previousInventory =
        this.playerInventories.get(player.name) || new Map();

      this.handleInventoryChanges(
        player,
        currentInventory,
        previousInventory,
        inventory
      );
      this.playerInventories.set(player.name, currentInventory);
    });
  }

  getPlayerInventory(player) {
    return player.getComponent("minecraft:inventory").container;
  }

  getCurrentInventory(inventory) {
    const inventoryMap = new Map();
    for (let i = 0; i < inventory.size; i++) {
      const item = inventory.getItem(i);
      if (item && this.monitoredItems.includes(item.typeId)) {
        inventoryMap.set(
          item.typeId,
          (inventoryMap.get(item.typeId) || 0) + item.amount
        );
      }
    }
    return inventoryMap;
  }

  handleInventoryChanges(
    player,
    currentInventory,
    previousInventory,
    inventory
  ) {
    for (const [typeId, amount] of currentInventory) {
      const previousAmount = previousInventory.get(typeId) || 0;

      if (amount > previousAmount) {
        const pickedUpAmount = amount - previousAmount;
        this.processItemPickup(player, typeId, pickedUpAmount, inventory);
      }
    }
  }

  // Function to process item pickups > update users balance
  async processItemPickup(player, typeId, pickedUpAmount, inventory) {
    const playerData = JSON.parse(player.getDynamicProperty("playerData"));
    if (!playerData.data.is_linked) {
      console.log(`Player ${player.name} is not linked`);
      player.runCommand(
        `title @s actionbar Your account is not linked, please link it first!`
      );
      return;
    }
    
    const response = await updateBalance(player,pickedUpAmount)
    if (response.status == 200) {
      const body = JSON.parse(response.body)
      console.log(JSON.stringify(body));
      player.runCommand(`scoreboard players set @s Mats ${body.balance}`);
      this.notifyPlayer(player, pickedUpAmount);
      this.removeItemsFromInventory(typeId, pickedUpAmount, inventory);
    }
  }
  notifyPlayer(player, pickedUpAmount) {
    const itemName = this.identifier.split(":")[1];
    player.runCommand("playsound random.pop @s");
    player.runCommand(`title @s actionbar §a +${pickedUpAmount} ${itemName}!`);
    player.runCommand("particle minecraft:critical ~ ~ ~");
    console.warn(`${player.name} picked up ${pickedUpAmount}x ${itemName}`);
  }

  // Function to remove items from the player's inventory
  removeItemsFromInventory(typeId, amountToRemove, inventory) {
    let remainingToRemove = amountToRemove;
    for (let i = 0; i < inventory.size && remainingToRemove > 0; i++) {
      const item = inventory.getItem(i);
      if (item && item.typeId === typeId) {
        if (item.amount <= remainingToRemove) {
          inventory.setItem(i, null);
          remainingToRemove -= item.amount;
        } else {
          item.amount -= remainingToRemove;
          inventory.setItem(i, item);
          remainingToRemove = 0;
        }
      }
    }
  }
}
