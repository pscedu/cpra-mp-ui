import { useAtomValue, useSetAtom, useAtom } from "jotai";
import * as atoms from "@/helpers/state";

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
  const showGridLabels = useAtomValue(atoms.showGridLabelsAtom);
  const showGridLines = useAtomValue(atoms.showGridLinesAtom);
  const showProjects = useAtomValue(atoms.showProjectsAtom);
  const showWater = useAtomValue(atoms.showWaterAtom);
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
          onCheckedChange={(checked) => (showGridLabels = checked)}
        >
          Show Grid Labels
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showGridLines}
          onCheckedChange={(checked) => (showGridLines = checked)}
        >
          Show Grid Lines
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showProjects}
          onCheckedChange={(checked) => (showProjects = checked)}
        >
          Show Projects
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showWater}
          onCheckedChange={(checked) => (showWater = checked)}
        >
          Show Water
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
