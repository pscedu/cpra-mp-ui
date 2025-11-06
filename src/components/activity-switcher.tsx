import { useAtom, useAtomValue } from "jotai";
import { activityAtom, userAtom } from "@/helpers/state";
import {
  ChevronsUpDown,
  CircleDot,
  Funnel,
  GalleryVerticalEnd,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function ActivitySwitcher() {
  const [activity, setActivity] = useAtom(activityAtom);
  const user = useAtomValue(userAtom);

  const { isMobile } = useSidebar();

  const choices: {
    name: string;
    label: string;
    logo: React.ElementType;
  }[] = [
    {
      name: "data",
      label: "Data",
      logo: Funnel,
    },
  ];

  if (user && user.clickupId)
    choices.push(
      {
        name: "issues",
        label: "Issues",
        logo: CircleDot,
      },
      {
        name: "simulations",
        label: "Simulations",
        logo: GalleryVerticalEnd,
      },
    );

  if (choices.length < 2) return null;

  const activeChoice = choices.find((choice) => choice.name === activity);

  if (!activeChoice) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <activeChoice.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeChoice.label}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Select a View
            </DropdownMenuLabel>
            {choices.map((choice) => (
              <DropdownMenuItem
                key={choice.name}
                onClick={() => setActivity(choice.name)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <choice.logo className="size-3.5 shrink-0" />
                </div>
                {choice.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
