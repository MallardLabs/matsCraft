import { httpReq } from "./httpReq";
const getXUID = async (player) => {
    const { nameTag } = player;
    try {
        // First try using mcprofile.io
        const primaryResponse = await httpReq({
            method: "get",
            url: `https://mcprofile.io/api/v1/bedrock/gamertag/${nameTag}`,
            headers: { "Content-Type": "application/json" },
        });
        const primaryData = JSON.parse(primaryResponse.body);
        // if it succeeds, return the XUID
        if (primaryData?.xuid) {
            console.warn(`XUID for ${nameTag} (mcprofile.io): ${primaryData.xuid}`);
            return primaryData.xuid;
        }
        // if it fails, fallback to geysermc.org
        const fallbackResponse = await httpReq({
            method: "get",
            url: `https://api.geysermc.org/v2/xbox/xuid/${nameTag}`,
            headers: { "Content-Type": "application/json" },
        });
        const fallbackData = JSON.parse(fallbackResponse.body);
        // if it succeeds, return the XUID
        if (fallbackData?.xuid) {
            console.warn(`XUID for ${nameTag} (geysermc.org): ${fallbackData.xuid}`);
            return fallbackData.xuid;
        }
        return null;
    }
    catch (error) {
        console.warn(`Error fetching XUID for ${nameTag}:`, error);
        return null;
    }
};
export default getXUID;
