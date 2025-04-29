import { usePortalState } from "@/helpers/state";

import { LoaderCircle } from "lucide-react";
import Comment from "./comment";
import StatusToken from "./status-token";
import TagToken from "./tag-token";
import IssueCloseButton from "./issue-close-button";
import UserToken from "./user-token";

export default function IssueDetail() {
  const { task } = usePortalState();

  console.log(task.value);

  if (!task.value)
    return (
      <li className="p-4 flex">
        <LoaderCircle className="animate-spin" />
      </li>
    );

  const {
    assignees,
    creator,
    dateCreated,
    description,
    id,
    name,
    status,
    tags,
  } = task.value;
  return (
    <div className="p-4">
      <div className="flex items-start justify-between">
        <h2 className="font-bold mb-2 text-2xl">{name}</h2>
        <IssueCloseButton />
      </div>
      <StatusToken {...status} />
      <div className="mb-2">
        {tags.map((tag) => (
          <TagToken key={tag.name} {...tag} />
        ))}
      </div>
      <div className="mb-2">
        {assignees.map((assignee) => (
          <UserToken key={assignee.name} user={assignee} />
        ))}
      </div>
      <Comment
        user={creator}
        date={dateCreated}
        action="opened"
        text={description}
      />
    </div>
  );
}
