import { Player } from "@minecraft/server";

export class Scoreboard {
  private title: string;
  private field: string[];
  private border: boolean;
  private center?: boolean;
  private logo?: boolean;

  constructor(border = true) {
    this.title = "Title";
    this.field = [];
    this.border = border;
  }

  setTitle(title: string, center = true, logo = true): void {
    this.title = title.replaceAll("\n", "");
    this.center = center;
    if (logo) {
      this.title = "§l§o§g§o§r";
      this.logo = true;
    }
  }

  addField(text: string): void {
    this.field.push(text.replaceAll("\n", ""));
  }

  send(player: Player): void {
    if (this.field.length <= 0) {
      throw new Error("You must add Field!");
    }

    const Scoreboard: { text?: string; translate?: string }[] = [];
    Scoreboard.push({ text: "§s§c§o§r§e§b§o§a§r§d§r" });
    Scoreboard.push({ text: this.border ? "§w§b§p§a§o§r" : "§n§b§p§a§o§r" });

    if (this.center) {
      const lengthText = findLength(this.field).replace(/§./g, "").length;
      const lengthTitle = this.title.replace(/§./g, "").length;
      let mustAdd = Math.round((lengthText - lengthTitle) / 2);

      if (mustAdd <= 0) mustAdd = 1;

      for (let i = 1; i <= mustAdd; i++) {
        Scoreboard.push({ text: " " });
      }
      Scoreboard.push({ translate: this.title });
      for (let i = 1; i <= mustAdd; i++) {
        Scoreboard.push({ text: " " });
      }
    } else {
      Scoreboard.push({ translate: this.title });
    }

    if (!this.logo) Scoreboard.push({ text: "§r\n " });

    for (const field of this.field) {
      Scoreboard.push({ text: "\n§r" });
      Scoreboard.push({ translate: field });
    }

    player.onScreenDisplay.setTitle({ rawtext: Scoreboard });
  }
}

function findLength(array: string[]): string {
  const lArray = array.slice();
  return lArray.sort(
    (a, b) => b.replace(/§./g, "").length - a.replace(/§./g, "").length
  )[0];
}
