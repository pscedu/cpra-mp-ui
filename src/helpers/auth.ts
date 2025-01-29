import { batch } from "@preact/signals";
import { jwtDecode } from "jwt-decode";
import { getEmailHash } from "./avatar";

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
    user.value = {
      username: decoded.sub,
      name: decoded.name,
      email: decoded.email,
      emailHash: await getEmailHash(decoded.email),
      clickup: decoded.clickup,
      accessToken: query.access_token,
      refreshToken: query.refresh_token,
    };

    route("/");
  })();
}

export function linkClickup({ route, query }) {
  console.log(query);
}
