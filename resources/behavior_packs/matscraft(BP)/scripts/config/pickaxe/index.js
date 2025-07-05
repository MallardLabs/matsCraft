export const pickaxeShop = [
    {
        id: "matscraft:nanndo_pickaxe",
        name: "Nanndo Pickaxe",
        cost: 50,
        icon: "textures/items/pickaxe/nando.png",
        message: "§lItem Name§r: Nanndo Pickaxe\n§lCost: §r50 Mats\n\n§lAbility\n§rBy Using Nanndo Pickaxe, you can get item drops from common,uncommon blocks",
    },
    {
        id: "matscraft:lowpolyduck_pickaxe",
        name: "lowpolyduck Pickaxe",
        cost: 150,
        icon: "textures/items/pickaxe/lowpolyduck.png",
        message: "§lItem Name§r: lowpolyduck Pickaxe\n§lCost: §r150 Mats\n\n§lAbility:\n§rBy Using lowpolyduck Pickaxe, you can get item drops from common,uncommon,rare,epic blocks",
    },
    {
        id: "matscraft:mezo_pickaxe",
        name: "Mezo Pickaxe",
        cost: 200,
        icon: "textures/items/pickaxe/mezo.png",
        message: "§lItem Name§r: Mezo Pickaxe\n§lCost: §r200 Mats\n\n§lAbility:\n§rBy Using Mezo Pickaxe, you can get item drops from common,uncommon,rare,epic,legendary blocks",
    },
];
export const pickAxeAbility = [
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
