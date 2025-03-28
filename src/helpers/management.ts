import { managementBaseUrl } from "./config";
import { getJson } from "./utils";

export async function getManagementJson(relativeUrl: string, user: any) {
  let res = await getJson(`${managementBaseUrl}${relativeUrl}`, {
    headers: { authorization: `Bearer ${user.accessToken}` },
  });
  if (!res.error) return res;
}

export async function getUserInfo(user) {
  return await getManagementJson("/current_user", user);
}
