import { toTitleCase } from "@/helpers/utils";

import UserAvatar from "./user-avatar";
import RelativeTime from "./relative-time";

export default function Comment({ user, action = "commented", date, text }) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm my-4 divide-y">
      <div className="flex items-center gap-2 p-2 bg-accent">
        <UserAvatar
          size={24}
          user={{ fullName: user.username, email: user.email }}
        />
        <span className="font-bold">{user.username}</span>
        {action}
        <RelativeTime
          className="text-sm text-muted-foreground"
          date={new Date(parseInt(date))}
          label={toTitleCase(action)}
        />
      </div>
      <div className="p-2">{text}</div>
    </div>
  );
}
