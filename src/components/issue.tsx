import { usePortalState } from "@/helpers/state";
import RelativeTime from "./relative-time";
import StatusIcon from "./status-icon";
import TagToken from "./tag-token";
import UserAvatar from "./user-avatar";

export default function Issue({ task }: { task: any }) {
  const { issue } = usePortalState();
  const { creator } = task;
  return (
    <li className="p-4 flex">
      <div className="mr-2 pt-[2px]">
        <span title={task.status.status}>
          <StatusIcon {...task.status} />
        </span>
      </div>
      <div>
        <div>
          <h2 className="inline font-bold mb-2 mr-2">
            <a
              className="hover:underline"
              href={`#activity=issues&issue=${task.id}`}
              onClick={(e) => {
                e.preventDefault();
                issue.value = task.id;
              }}
            >
              {task.name}
            </a>
          </h2>
          {task.tags.map((tag) => (
            <TagToken key={tag.name} {...tag} />
          ))}
        </div>
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
