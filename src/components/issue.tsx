import { useAtomValue, useSetAtom, useAtom } from "jotai";
import * as atoms from "@/helpers/state";

// State atoms
const issue = useAtomValue(atoms.issueAtom);
const issueFilterTags = useAtomValue(atoms.issueFilterTagsAtom);
const tagOptions = useAtomValue(atoms.tagOptionsAtom);
import RelativeTime from "./relative-time";
import StatusIcon from "./status-icon";
import TagToken from "./tag-token";
import UserAvatars from "./user-avatars";

export default function Issue({ task }: { task: any }) {
  
  const { creator } = task;
  const selectTag = (tagName) => {
    const option = tagOptions?.find((opt) => opt === tagName);
    if (option) issueFilterTags = [...issueFilterTags, option];
  };
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
                issue = task.id;
              }}
            >
              {task.name}
            </a>
          </h2>
          {task.tags.map((tag) => (
            <TagToken
              key={tag.name}
              {...tag}
              onClick={() => selectTag(tag.name)}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <UserAvatars
            size={24}
            users={[
              {
                fullName: creator.fullName || creator.username,
                email: creator.email,
              },
              ...task.assignees.filter(
                (assignee) => assignee.email != creator.email,
              ),
            ]}
          />
          <RelativeTime
            className="text-sm text-muted-foreground"
            date={new Date(parseInt(task.dateUpdated))}
            label="Created"
          />
        </div>
      </div>
    </li>
  );
}
