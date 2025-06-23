import UserAvatar from "./user-avatar";

export default function UserToken({
  onClick,
  user,
}: {
  onClick?: Function;
  user: any;
}) {
  const Tag = onClick ? "button" : "span";

  return (
    <Tag className="inline-block px-2 py-0.75 rounded-md min-w mr-2 mb-2 text-sm font-bold bg-accent">
      <span className="flex gap-2 items-center">
        <UserAvatar user={user} size={16} />
        {user.fullName}
      </span>
    </Tag>
  );
}
