import { variables } from "@minecraft/server-admin";
const BASE_URL = variables.get("BASE_URL");
export const ENDPOINTS = {
  BASE_URL,
  AUTH: `${BASE_URL}/api/users/auth`,
  UPDATE_BALANCE: `${BASE_URL}/api/users/update-balance`,
  INSERT_BLOCK: `${BASE_URL}/api/matscraft/add-blocks`,
  LOGOUT: `${BASE_URL}/api/users/logout`,
};
