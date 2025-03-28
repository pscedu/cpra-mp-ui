import { batch } from "@preact/signals";
import { jwtDecode } from "jwt-decode";
import { getEmailHash } from "./avatar";
import { getManagementJson } from "./management";

const userKey = "cpra.mp.user";

export function loadUser() {
  const userJsonString = localStorage.getItem(userKey);
  if (!userJsonString) return null;
  return JSON.parse(userJsonString);
}

export function saveUser(user) {
  if (user) {
    localStorage.setItem(userKey, JSON.stringify(user));
  } else {
    localStorage.removeItem(userKey);
  }
}

export function completeLogin(
  { route, query },
  { user },
  { description, heading, status }
) {
  const loginError = (msg) => {
    batch(() => {
      description.value = msg;
      heading.value = "Login error";
      status.value = "error";
    });
  };
  if (!("access_token" in query) || !("refresh_token" in query))
    return loginError("Required token parameters are missing.");

  let decoded;
  try {
    decoded = jwtDecode(query.access_token);
  } catch (err) {
    return loginError(err);
  }

  (async () => {
    const currentUser = await getManagementJson("/users/current_user", {
      accessToken: query.access_token,
    });

    if (currentUser.error) return loginError(currentUser.error);

    user.value = {
      ...currentUser,
      accessToken: query.access_token,
      emailHash: await getEmailHash(currentUser.email),
      refreshToken: query.refresh_token,
    };

    route("/");
  })();
}

export function linkClickup({ route, query }, { user }) {
  if (query.status === "success") {
    user.value = {
      ...user.value,
      clickupId: query.clickup_id,
    };
  } else {
    // TODO: Add error handling for failed link operation.
  }
  route("/profile");
}
