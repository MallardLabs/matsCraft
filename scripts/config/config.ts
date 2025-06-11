import { variables } from "@minecraft/server-admin";
const BASE_URL = variables.get("BASE_URL");
export const CONFIG = {
  BASE_URL,
  SECRET_KEY: variables.get("SECRET_KEY"),
  AUTH: `${BASE_URL}/users`,
  GET_USER_DATA: `${BASE_URL}/users`,
  ITEM_PICKUP: `${BASE_URL}/users`,
  UPDATE_BALANCE: `${BASE_URL}/users`,
  INSERT_BLOCK: `${BASE_URL}/users/blocks`,
  LOGOUT: `${BASE_URL}/users`,
};

export default CONFIG;
