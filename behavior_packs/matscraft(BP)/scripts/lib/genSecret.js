import CONFIG from "../config/config";
import { stringToBase62 } from "./base62";
function encrypt(input, key) {
    let output = "";
    for (let i = 0; i < input.length; i++) {
        const charCode = input.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        output += String.fromCharCode(charCode);
    }
    return output;
}
const genSecret = () => {
    const payload = JSON.stringify({
        expires: Math.floor(Date.now() / 1000) + 5 * 60,
    });
    const encrypted = encrypt(payload, CONFIG.SECRET_KEY);
    return stringToBase62(encrypted);
};
export default genSecret;
