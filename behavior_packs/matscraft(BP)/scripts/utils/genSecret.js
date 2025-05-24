import { variables } from "@minecraft/server-admin";
function encrypt(input, key) {
    let output = "";
    for (let i = 0; i < input.length; i++) {
        const charCode = input.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        output += String.fromCharCode(charCode);
    }
    return output;
}
function decrypt(input, key) {
    return encrypt(input, key);
}
// Encode string ke Base64
function toBase64(str) {
    // di environment JS biasa: btoa(str)
    // tapi di Minecraft scripting bisa pakai Buffer (Node.js) jika tersedia, atau polyfill manual
    return Buffer.from(str, "binary").toString("base64");
}
// Decode Base64 ke string
function fromBase64(b64) {
    return Buffer.from(b64, "base64").toString("binary");
}
const genSecret = () => {
    const payload = JSON.stringify({
        expires: Math.floor(Date.now() / 1000) + 10 * 60,
    });
    const encrypted = encrypt(payload, variables.get("SECRET_KEY"));
    return toBase64(encrypted);
};
const decodeSecret = (base64str) => {
    const encrypted = fromBase64(base64str);
    const decrypted = decrypt(encrypted, variables.get("SECRET_KEY"));
    return decrypted;
};
export default genSecret;
