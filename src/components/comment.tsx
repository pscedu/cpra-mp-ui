import { toTitleCase } from "@/helpers/utils";
import { useSignal } from "@preact/signals-react";
import { usePortalState } from "@/helpers/state";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Pencil } from "lucide-react";
import UserAvatar from "@/components/user-avatar";
import RelativeTime from "@/components/relative-time";

export default function Comment({
  user,
  action = "commented",
  date,
  commentText,
}) {
  const { user: authUser } = usePortalState();
  const isEditing = useSignal(false);
  const isProcessing = useSignal(false);

  const fullName = user.fullName || user.username;
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm my-4 divide-y">
      <div className="flex justify-between p-2 bg-accent">
        <div className="flex items-center gap-2">
          <UserAvatar size={24} user={{ fullName, email: user.email }} />
          <div className="mt-1 leading-4">
            <span className="font-bold leading-4">{fullName}</span> {action}{" "}
            <RelativeTime
              className="text-sm text-muted-foreground leading-4 whitespace-nowrap"
              date={new Date(parseInt(date))}
              label={toTitleCase(action)}
            />
          </div>
        </div>
        {user.id === authUser.value.id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="cursor-pointer">
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side="bottom"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="cursor-pointer"
                  disabled={isEditing.value || isProcessing.value}
                >
                  <Pencil />
                  Edit comment
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="p-2">{commentText}</div>
    </div>
  );
}
