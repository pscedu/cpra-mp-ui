import RelativeTime from "./relative-time";
import StatusIcon from "./status-icon";
import UserAvatar from "./user-avatar";

export default function Issue({ task }) {
  const { creator } = task;
  return (
    <li className="p-4 flex">
      <div className="mr-2 pt-[2px]">
        <StatusIcon {...task.status} />
      </div>
      <div>
        <h2 className="font-bold mb-2">
          <a className="hover:underline" href="#">
            {task.name}
          </a>
        </h2>
        <div className="flex items-center gap-2">
          <UserAvatar
            size={24}
            user={{ fullName: creator.username, email: creator.email }}
          />
          <RelativeTime
            className="text-sm text-muted-foreground"
            date={new Date(parseInt(task.dateCreated))}
            label="Created"
          />
        </div>
      </div>
    </li>
  );
}
