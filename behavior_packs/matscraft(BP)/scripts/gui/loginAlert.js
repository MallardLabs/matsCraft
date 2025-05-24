import { MessageFormData } from "@minecraft/server-ui";
import auth from "./auth";
export default (player) => {
    const form = new MessageFormData()
        .title("MatsCraft Portal")
        .body("Welcome To Matscraft Server!\n\nTo begin your journey on Matscraft, please link your discord account!")
        .button1("Explore Without Linking")
        .button2("Link Account");
    form.show(player).then((res) => {
        if (res.selection === 1) {
            auth(player);
        }
    });
};
