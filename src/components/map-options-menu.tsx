import { useAtomValue, useSetAtom, useAtom } from "jotai";
import {
  showGridLabelsAtom,
  showGridLinesAtom,
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
  const showGridLabels = useAtomValue(showGridLabelsAtom);
  const setShowGridLabels = useSetAtom(showGridLabelsAtom);
  const showGridLines = useAtomValue(showGridLinesAtom);
  const setShowGridLines = useSetAtom(showGridLinesAtom);
  const showProjects = useAtomValue(showProjectsAtom);
  const setShowProjects = useSetAtom(showProjectsAtom);
  const showWater = useAtomValue(showWaterAtom);
  const setShowWater = useSetAtom(showWaterAtom);

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
          checked={showGridLines}
          onCheckedChange={(checked) => setShowGridLines(checked)}
        >
          Show Grid Lines
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
