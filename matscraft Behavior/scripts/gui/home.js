import { MessageFormData } from "@minecraft/server-ui";
import { showLinkAccountForm } from "./linkAccount.js";

export const showHome = (player) => {
  const form = new MessageFormData()
    .title("MatsCraft Portal")
    .body(
      "You must link your Discord account to play. Progress won't be saved without linking."
    )
    .button1("Explore Without Linking")
    .button2("Link Account");

  form.show(player).then((res) => {
    if (res.selection === 1) {
      showLinkAccountForm(player);
    }
  });
};