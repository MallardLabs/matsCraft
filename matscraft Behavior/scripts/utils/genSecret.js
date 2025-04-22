import "../lib/crypto-bundle";
import { variables } from "@minecraft/server-admin";

// Buat IV manual (harus 16 byte / 128-bit)
const iv = CryptoJS.enc.Hex.parse("00000000000000000000000000000000");

// Gunakan kunci dalam format WordArray
const key = CryptoJS.enc.Utf8.parse(variables.get("SECRET_KEY"));

export const genSecret = () => {
  const payload = JSON.stringify({
    expires: Math.floor(Date.now() / 1000) + 10 * 60,
  });

  const encrypted = CryptoJS.AES.encrypt(payload, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();

  console.log(encrypted);
  return encrypted;
};
