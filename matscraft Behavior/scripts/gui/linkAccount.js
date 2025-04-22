import { ModalFormData } from "@minecraft/server-ui";
import { verifyCode } from "../services/authService.js";

export const showLinkAccountForm = (player, title = "§eVerification Code") => {
  const form = new ModalFormData()
    .title(title)
    .textField("", "xxx-xxx")
    .dropdown("§oTips: Get code from", ["Nexus Bot", "https://mallardlabs.xyz"]);

  form.show(player).then((res) => {
    if (res.canceled) return;
    const code = res.formValues[0];
    verifyCode(player, code);
  });
};