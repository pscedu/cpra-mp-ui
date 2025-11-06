import { useAtom } from "jotai";
import {
  showGridLabelsAtom,
  showProjectsAtom,
  showWaterAtom,
} from "@/helpers/state";

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
  const [showGridLabels, setShowGridLabels] = useAtom(showGridLabelsAtom);
  const [showProjects, setShowProjects] = useAtom(showProjectsAtom);
  const [showWater, setShowWater] = useAtom(showWaterAtom);

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
          checked={showGridLabels}
          onCheckedChange={(checked) => setShowGridLabels(checked)}
        >
          Show Grid Labels
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showProjects}
          onCheckedChange={(checked) => setShowProjects(checked)}
        >
          Show Projects
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showWater}
          onCheckedChange={(checked) => setShowWater(checked)}
        >
          Show Water
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
