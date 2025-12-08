import { useEffect } from "react";
import { useAtomValue, useSetAtom, useAtom } from "jotai";
import * as atoms from "@/helpers/state";

// State atoms
const avatarCacheKey = useAtomValue(atoms.avatarCacheKeyAtom);
const currentUser = useAtomValue(atoms.userAtom);

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getEmailHash } from "@/helpers/avatar";

export default function UserAvatar({ user = null, size = 32, className = "" }) {
  
  const uri: Signal<string | null> = useSignal(null);

  const avatarUser = user || currentUser;
  const cacheKey =
    avatarUser == currentUser ? avatarCacheKey : null;

  useEffect(() => {
    (async () => {
      const emailHash = await getEmailHash(avatarUser.email);
      uri = `https://www.gravatar.com/avatar/${emailHash}?d=initials&name=${encodeURIComponent(
        avatarUser.fullName,
      )}&s=${size}${cacheKey ? `&cache-key=${cacheKey}` : ""}`;
    })();
  }, [avatarUser, size, uri]);

  return (
    <span title={avatarUser.fullName}>
      <Avatar
        className={`${size > 24 ? "rounded-lg" : "rounded-sm"} ${className}`}
        style={{ height: `${size}px`, width: `${size}px` }}
      >
        {uri !== null && (
          <AvatarImage src={uri} alt={avatarUser.fullName} />
        )}
        <AvatarFallback className="rounded-lg"></AvatarFallback>
      </Avatar>
    </span>
  );
}
