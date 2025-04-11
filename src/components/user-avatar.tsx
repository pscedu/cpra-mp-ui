import { useEffect } from "react";
import { Signal, useSignal } from "@preact/signals-react";
import { usePortalState } from "@/helpers/state";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getEmailHash } from "@/helpers/avatar";

export default function UserAvatar({ user = null, size = 32 }) {
  const { avatarCacheKey, user: currentUser } = usePortalState();
  const uri: Signal<string | null> = useSignal(null);

  const avatarUser = user || currentUser.value;
  const cacheKey =
    avatarUser == currentUser.value ? avatarCacheKey.value : null;

  useEffect(() => {
    (async () => {
      const emailHash = await getEmailHash(avatarUser.email);
      uri.value = `https://www.gravatar.com/avatar/${emailHash}?d=initials&name=${encodeURIComponent(
        avatarUser.fullName
      )}&s=${size}${cacheKey ? `&cache-key=${cacheKey}` : ""}`;
    })();
  }, [avatarUser, size, uri]);

  return (
    <span title={avatarUser.fullName}>
      <Avatar
        className={size > 24 ? "rounded-lg" : "rounded-sm"}
        style={{ height: `${size}px`, width: `${size}px` }}
      >
        {uri.value !== null && (
          <AvatarImage src={uri.value} alt={avatarUser.fullName} />
        )}
        <AvatarFallback className="rounded-lg"></AvatarFallback>
      </Avatar>
    </span>
  );
}
