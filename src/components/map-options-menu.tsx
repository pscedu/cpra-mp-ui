import { usePortalState } from "@/helpers/state";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";

export default function MapOptionsMenu() {
  const { showGridLabels, showProjects, showWater } = usePortalState();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Map Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={showGridLabels.value}
          onCheckedChange={(checked) => (showGridLabels.value = checked)}
        >
          Show Grid Labels
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showProjects.value}
          onCheckedChange={(checked) => (showProjects.value = checked)}
        >
          Show Projects
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showWater.value}
          onCheckedChange={(checked) => (showWater.value = checked)}
        >
          Show Water
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
