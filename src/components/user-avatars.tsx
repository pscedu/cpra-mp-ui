import UserAvatar from "./user-avatar";

export default function UserAvatars({ users, size = 32 }) {
  return (
    <div className="flex">
      {users.map((user, i) => (
        <UserAvatar
          key={user.email}
          user={user}
          size={size}
          className={`outline-2 outline-background ${i > 0 ? "-ms-2" : ""}`}
        />
      ))}
    </div>
  );
}
