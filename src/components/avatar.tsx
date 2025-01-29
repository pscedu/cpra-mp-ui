import { Avatar as PrimerAvatar } from "@primer/react";
import { usePortalState } from "../helpers/state";

export default function Avatar({
  user = null,
  size = 24,
  defaultImage = "identicon",
}) {
  const { avatarCacheKey, user: currentUser } = usePortalState();
  const avatarUser = user || currentUser.value;
  const cacheKey =
    avatarUser == currentUser.value ? avatarCacheKey.value : null;

  let uri = `https://www.gravatar.com/avatar/${avatarUser.emailHash}?d=${defaultImage}&s=${size}`;
  if (cacheKey) uri += `&cache-key=${cacheKey}`;

  return <PrimerAvatar src={uri} size={size} />;
}
