import { toTitleCase } from "@/helpers/utils";

import UserAvatar from "./user-avatar";
import RelativeTime from "./relative-time";

export default function Comment({
  user,
  action = "commented",
  date,
  commentText,
}) {
  const fullName = user.fullName || user.username;
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm my-4 divide-y">
      <div className="flex items-start gap-2 p-2 bg-accent">
        <UserAvatar size={24} user={{ fullName, email: user.email }} />
        <div className="mt-1 leading-4">
          <span className="font-bold leading-4">{fullName}</span> {action}{" "}
          <RelativeTime
            className="text-sm text-muted-foreground leading-4"
            date={new Date(parseInt(date))}
            label={toTitleCase(action)}
          />
        </div>
      </div>
      <div className="p-2">{commentText}</div>
    </div>
  );
}
