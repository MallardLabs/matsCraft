import { variables } from "@minecraft/server-admin";
const BASE_URL = variables.get("BASE_URL");
const ore_config = {
    "common_mats_ore": [
        {
            id: "matscraft:mats",
            min: 1,
            max: 2,
        },
        {
            id: "matscraft:huh",
            min: 1,
            max: 3,
        },
    ],
    "uncommon_mats_ore": [
        {
            id: "matscraft:mats",
            min: 1,
            max: 3,
        },
        {
            id: "matscraft:huh",
            min: 1,
            max: 4,
        },
    ],
    "rare_mats_ore": [
        {
            id: "matscraft:mats",
            min: 2,
            max: 4,
        },
        {
            id: "matscraft:huh",
            min: 1,
            max: 4,
        },
    ],
    "epic_mats_ore": [
        {
            id: "matscraft:mats",
            min: 3,
            max: 6,
        },
        {
            id: "matscraft:huh",
            min: 1,
            max: 7,
        },
    ],
    "legendary_mats_ore": [
        {
            id: "matscraft:mats",
            min: 10,
            max: 25,
        },
        {
            id: "matscraft:huh",
            min: 1,
            max: 26,
        },
    ],
};
export const CONFIG = {
    BASE_URL,
    SECRET_KEY: variables.get("SECRET_KEY"),
    AUTH: `${BASE_URL}/users`,
    GET_USER_DATA: `${BASE_URL}/users`,
    ITEM_PICKUP: `${BASE_URL}/users`,
    UPDATE_BALANCE: `${BASE_URL}/users`,
    INSERT_BLOCK: `${BASE_URL}/users/blocks`,
    LOGOUT: `${BASE_URL}/users`,
    ORE_CONFIG: ore_config,
};
export default CONFIG;
