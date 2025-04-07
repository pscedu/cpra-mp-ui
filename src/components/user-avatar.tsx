import { usePortalState } from "@/helpers/state";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserAvatar({
  user = null,
  size = 32,
  defaultImage = "identicon",
}) {
  const { avatarCacheKey, user: currentUser } = usePortalState();
  const avatarUser = user || currentUser.value;
  const cacheKey =
    avatarUser == currentUser.value ? avatarCacheKey.value : null;

  let uri = `https://www.gravatar.com/avatar/${avatarUser.emailHash}?d=${defaultImage}&s=${size}`;
  if (cacheKey) uri += `&cache-key=${cacheKey}`;

  return (
    <Avatar className="h-8 w-8 rounded-lg">
      <AvatarImage src={uri} alt={user.fullName} />
      <AvatarFallback className="rounded-lg">CN</AvatarFallback>
    </Avatar>
  );
}
