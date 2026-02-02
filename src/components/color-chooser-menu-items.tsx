import { selectionColors, selectionColorLabels } from "@/helpers/config";
import { useAtom } from "jotai";
import { selectedGeographiesAtom } from "@/helpers/state";

import { ContextMenuItem } from "@/components/ui/context-menu";
import { Circle, CircleCheckBig } from "lucide-react";

// Color chooser that allows users to select what color a selected geography will
// be assigned.
export default function ColorChooserMenuItems({
  geography,
}: {
  geography: any;
}) {
  const [selectedGeographies, setSelectedGeographies] = useAtom(
    selectedGeographiesAtom,
  );

  const isSelected = selectedGeographies?.includes(geography);

  return selectionColors
    .slice(0, selectedGeographies?.length + (isSelected ? 0 : 1))
    .map((color, colorIdx) => {
      const selected = selectedGeographies[colorIdx] == geography;
      const Icon = selected ? CircleCheckBig : Circle;

      return (
        <ContextMenuItem
          key={colorIdx}
          disabled={selected}
          onSelect={() => {
            const newGeographies = [...selectedGeographies];
            if (!isSelected) newGeographies.push(geography);
            const currentIdx = newGeographies.indexOf(geography);
            const currentId = newGeographies[colorIdx];
            setSelectedGeographies(
              newGeographies.map((id: any, i: number) =>
                i == colorIdx ? geography : i == currentIdx ? currentId : id,
              ),
            );
          }}
        >
          <Icon style={{ color: `#${color}` }} />{" "}
          {selectionColorLabels[colorIdx]}
        </ContextMenuItem>
      );
    });
}
