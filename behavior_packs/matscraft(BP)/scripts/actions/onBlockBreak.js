import blockBreak from "../events/blockBreak";
import { worldGetData, worldSetData } from "../utils/worldUtils";
import generateRandomString from "../utils/genRandomStr";
import CONFIG from "../config/config";
import { world } from "@minecraft/server";
import httpReq from "../lib/httpReq";
import { getPlayerData } from "../utils/playerUtils";
import genSecret from "../lib/genSecret";
const pickAxeAbility = [
    {
        typeId: "matscraft:nanndo_pickaxe",
        allowed: ["matscraft:common_mats_ore", "matscraft:uncommon_mats_ore"],
    },
    {
        typeId: "matscraft:lowpolyduck_pickaxe",
        allowed: [
            "matscraft:common_mats_ore",
            "matscraft:uncommon_mats_ore",
            "matscraft:rare_mats_ore",
            "matscraft:epic_mats_ore",
        ],
    },
    {
        typeId: "matscraft:mezo_pickaxe",
        allowed: [
            "matscraft:common_mats_ore",
            "matscraft:uncommon_mats_ore",
            "matscraft:rare_mats_ore",
            "matscraft:epic_mats_ore",
            "matscraft:legendary_mats_ore",
        ],
    },
];
blockBreak.listen((data, actions) => {
    const { player, blockId, location, toolTypeId } = data;
    const playerData = getPlayerData(player);
    if (!playerData || !playerData.data.is_linked) {
        actions.restore();
        actions.removeDropItem();
        return;
    }
    // Only handle blocks that include "matscraft"
    const isMatscraftBlock = blockId.includes("matscraft");
    if (!isMatscraftBlock) {
        actions.removeDropItem();
        return;
    }
    const pickAxe = pickAxeAbility.find((p) => p.typeId === toolTypeId);
    // If no matching pickaxe or block not allowed, prevent drop
    if (!pickAxe || !pickAxe.allowed.includes(blockId)) {
        actions.removeDropItem();
        return;
    }
    // All checks passed, store the block data
    const blockData = createBlockData(playerData.xuid, blockId, location);
    storePendingBlock(blockData);
});
const createBlockData = (xuid, blockName, location) => {
    return {
        hash: generateRandomString(),
        minecraft_id: xuid,
        block: blockName.replace("matscraft:", ""),
        location: {
            x: location.x,
            y: location.y,
            z: location.z,
        },
        mined_at: new Date().toISOString(),
    };
};
const storePendingBlock = async (data) => {
    let blockData = worldGetData("pendingBlock") ??
        worldSetData("pendingBlock", JSON.stringify([]));
    let parsed = [];
    try {
        parsed = blockData ? JSON.parse(blockData) : [];
    }
    catch (err) {
        console.error("Failed to parse pendingBlock:", err);
    }
    parsed.push(data);
    console.log(parsed.length);
    if (parsed.length >= 10) {
        await updateBlock(parsed);
    }
    else {
        world.setDynamicProperty("pendingBlock", JSON.stringify(parsed)); // Update local store
    }
};
const updateBlock = async (data) => {
    try {
        const response = await httpReq.request({
            method: "POST",
            url: CONFIG.INSERT_BLOCK,
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
                matscraft_token: genSecret(),
            },
        });
        if (response.status === 200) {
            console.info("Successfully saved blocks to database");
            world.setDynamicProperty("pendingBlock", JSON.stringify([]));
        }
        else {
            console.error(`Failed to save blocks: ${response.status} - ${response.body}`);
            // Save back to pending if failed
            world.setDynamicProperty("pendingBlock", JSON.stringify(data));
        }
    }
    catch (error) {
        console.error(`Error sending blocks to database: ${error.message}`);
        world.setDynamicProperty("pendingBlock", JSON.stringify(data));
    }
};
