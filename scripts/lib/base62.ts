const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function byteToBase62(byte: number): string {
  const high = Math.floor(byte / 62);
  const low = byte % 62;
  return BASE62[high] + BASE62[low];
}

function base62ToByte(str: string): number {
  const high = BASE62.indexOf(str[0]);
  const low = BASE62.indexOf(str[1]);
  return high * 62 + low;
}

export function stringToBase62(str: string): string {
  let result = "";
  for (let i = 0; i < str.length; i++) {
    result += byteToBase62(str.charCodeAt(i));
  }
  return result;
}

export function base62ToString(encoded: string): string {
  let result = "";
  for (let i = 0; i < encoded.length; i += 2) {
    result += String.fromCharCode(base62ToByte(encoded.substring(i, i + 2)));
  }
  return result;
}
