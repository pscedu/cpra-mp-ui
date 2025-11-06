"use client";
import { useAtom, useSetAtom } from "jotai";
import { avatarCacheKeyAtom, userAtom } from "@/helpers/state";
import { launchGravatarEditor } from "@/helpers/avatar";
import { clickupUrl, loginUrl } from "@/helpers/config";

import { ChevronsUpDown, CircleUser, Link, LogIn, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import UserAvatar from "./user-avatar";

export function NavUser() {
  const setAvatarCacheKey = useSetAtom(avatarCacheKeyAtom);
  const [user, setUser] = useAtom(userAtom);

  const { isMobile } = useSidebar();

  let menuContent;

  if (user) {
    const userNameAndAvatar = (
      <>
        <UserAvatar user={user} />
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{user.fullName}</span>
          <span className="truncate text-xs">{user.email}</span>
        </div>
      </>
    );
    menuContent = (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {userNameAndAvatar}
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                {userNameAndAvatar}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() =>
                  launchGravatarEditor(user.email, () => {
                    setAvatarCacheKey(new Date().getTime());
                  })
                }
              >
                <CircleUser />
                Update avatar image
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={user.clickupId !== null}
                onClick={() =>
                  (window.location.href = `${clickupUrl}?access_token=${encodeURIComponent(
                    user.accessToken,
                  )}`)
                }
              >
                <Link />
                {user.clickupId === null
                  ? "Link ClickUp account"
                  : "ClickUp account linked"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setUser(null)}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  } else {
    menuContent = (
      <>
        <SidebarMenuButton
          size="lg"
          onClick={() => (window.location.href = loginUrl)}
        >
          <LogIn />
          <span className="group-data-[collapsible=icon]:hidden">Log In</span>
        </SidebarMenuButton>
      </>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>{menuContent}</SidebarMenuItem>
    </SidebarMenu>
  );
}
