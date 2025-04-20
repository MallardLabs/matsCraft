const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeBase62(num) {
  if (num === 0) return BASE62[0];

  let result = "";
  while (num > 0) {
    result = BASE62[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result;
}

function decodeBase62(str) {
  let num = 0;
  for (let char of str) {
    num = num * 62 + BASE62.indexOf(char);
  }
  return num;
}

function stringToBase62(str) {
  let num = 0;
  for (let i = 0; i < str.length; i++) {
    num = num * 256 + str.charCodeAt(i);
  }
  return encodeBase62(num);
}

function base62ToString(encoded) {
  let num = decodeBase62(encoded);
  let result = "";
  while (num > 0) {
    result = String.fromCharCode(num % 256) + result;
    num = Math.floor(num / 256);
  }
  return result;
}
export { encodeBase62, decodeBase62, stringToBase62, base62ToString };
