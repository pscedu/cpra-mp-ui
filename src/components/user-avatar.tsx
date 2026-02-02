import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import {
  avatarCacheKeyAtom,
  userAtom,
} from "@/helpers/state";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getEmailHash } from "@/helpers/avatar";

export default function UserAvatar({
  user = null,
  size = 32,
  className = "",
}: {
  user?: any;
  size?: number;
  className?: string;
}) {
  const avatarCacheKey = useAtomValue(avatarCacheKeyAtom);
  const currentUser = useAtomValue(userAtom);

  const [uri, setUri] = useState<string | null>(null);

  const avatarUser = user || currentUser;
  const cacheKey = avatarUser == currentUser ? avatarCacheKey : null;

  useEffect(() => {
    (async () => {
      const emailHash = await getEmailHash(avatarUser.email);
      setUri(
        `https://www.gravatar.com/avatar/${emailHash}?d=initials&name=${encodeURIComponent(
          avatarUser.fullName,
        )}&s=${size}${cacheKey ? `&cache-key=${cacheKey}` : ""}`,
      );
    })();
  }, [avatarUser, size, cacheKey]);

  return (
    <span title={avatarUser.fullName}>
      <Avatar
        className={`${size > 24 ? "rounded-lg" : "rounded-sm"} ${className}`}
        style={{ height: `${size}px`, width: `${size}px` }}
      >
        {uri !== null && <AvatarImage src={uri} alt={avatarUser.fullName} />}
        <AvatarFallback className="rounded-lg"></AvatarFallback>
      </Avatar>
    </span>
  );
}
