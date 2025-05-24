import { variables } from "@minecraft/server-admin";
const BASE_URL = variables.get("BASE_URL");
export const CONFIG = {
  BASE_URL,
  SECRET_KEY: variables.get("SECRET_KEY"),
  AUTH: `${BASE_URL}/users/auth`,
  GET_BALANCE: `${BASE_URL}/users`,
  UPDATE_BALANCE: `${BASE_URL}/users/updateBalance`,
  INSERT_BLOCK: `${BASE_URL}/users/insert_block`,
  LOGOUT: `${BASE_URL}/users`,
};

export default CONFIG;
