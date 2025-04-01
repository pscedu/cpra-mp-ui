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
