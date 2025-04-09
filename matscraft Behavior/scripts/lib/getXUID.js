import { httpReq } from "./httpReq";
export async function getXUID(player) {
  try {
    const response = await httpReq.request({
      method: "GET",
      url: `https://api.geysermc.org/v2/xbox/xuid/${player.nameTag}`,
      headers: {
        "Content-Type": "application/json",
      },
    });
    const body = JSON.parse(response.body);
    console.warn(`XUID for ${player.nameTag}: ${body.xuid}`);
    return body.xuid;
  } catch (error) {
    console.warn(`Error fetching XUID: ${error}`);
    return null;
  }
}
