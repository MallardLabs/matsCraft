const BASE_URL = "https://matscraft-wiki.vercel.app";
export const config = {
  ENDPOINTS: {
    AUTH: `${BASE_URL}/api/users/auth`,
    BALANCE: `${BASE_URL}/api/users/get-balance/`,
    UPDATE_BALANCE: `${BASE_URL}/api/users/update-balance`,
    BALANCE: `${BASE_URL}/api/users/balance`,
    INSERT_BLOCK: `${BASE_URL}/api/matscraft/add-blocks`,
    SYNC_BALANCE: `${BASE_URL}/api/users/sync-balance`,
    LOGOUT: `${BASE_URL}/api/users/logout`,
  },
};
