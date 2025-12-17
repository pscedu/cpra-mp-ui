import { useAtom } from "jotai";
import { mapOptionsAtom } from "@/helpers/state";

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
  const [mapOptions, setMapOptions] = useAtom(mapOptionsAtom);
  const setOption = (key: string, value: boolean) =>
    setMapOptions({ ...mapOptions, [key]: value });

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
          checked={mapOptions.showGridLabels}
          onCheckedChange={(checked) => setOption("showGridLabels", checked)}
        >
          Show Grid Labels
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={mapOptions.showGridLines}
          onCheckedChange={(checked) => setOption("showGridLines", checked)}
        >
          Show Grid Lines
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={mapOptions.showProjects}
          onCheckedChange={(checked) => setOption("showProjects", checked)}
        >
          Show Projects
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={mapOptions.showWater}
          onCheckedChange={(checked) => setOption("showWater", checked)}
        >
          Show Water
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
