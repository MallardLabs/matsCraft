import { Player } from "@minecraft/server"

export class Scoreboard {
  constructor(border = true) {
    this.title = "Title"
    this.field = []
    this.border = border
  }

  /**
   * Set Title for Scoreboard
   * @param {String} title 
   */
  setTitle(title, center = true, logo = true) {
    this.title = title.replaceAll("\n", "")
    this.center = center
    if (logo) {
      this.title = "§l§o§g§o§r"
      this.logo = true
    }
  }

  /**
   * Add Field to Scoreboard
   * @param {String} text 
   */
  addField(text) {
    this.field.push(text.replaceAll("\n", ""))
  }

  /**
   * Send Scoreboard to Player
   * @param {Player} player 
   */
  send(player) {
    if (this.field.length <= 0)
      throw new Error("You must add Field!")
    let Scoreboard = []
    Scoreboard.push({ text: "§s§c§o§r§e§b§o§a§r§d§r" })
    if (this.border) {
      Scoreboard.push({ text: "§w§b§p§a§o§r" })
    } else {
      Scoreboard.push({ text: "§n§b§p§a§o§r" })
    }
    if (this.center) {
      let lengthText = findLength(this.field).replace(/§./g, "").length
      let lengthTitle = this.title.replace(/§./g, "").length
      let mustAdd = Math.round((lengthText - lengthTitle) / 2)

      if (mustAdd <= 0)
        mustAdd = 1

      // Setting Title
      for (let i = 1; i <= mustAdd; i++) {
        Scoreboard.push({ text: " " })
      }
      Scoreboard.push({ translate: this.title })
      for (let i = 1; i <= mustAdd; i++) {
        Scoreboard.push({ text: " " })
      }
    } else {
      Scoreboard.push({ translate: this.title })
    }

    // Adding Field
    if (!this.logo) Scoreboard.push({ text: "§r\n " })
    for (const field of this.field) {
      Scoreboard.push({ text: "\n§r" })
      Scoreboard.push({ translate: field })
    }

    // Sending Scoreboard
    player.onScreenDisplay.setTitle({ rawtext: Scoreboard })
  }
}

/**
 * @param {String[]} array
 * @returns {String}
 */
function findLength(array) {
  let lArray = array.slice()
  let lengthText = lArray.sort((a, b) => b.replace(/§./g, "").length - a.replace(/§./g, "").length)[0]
  return lengthText
}
