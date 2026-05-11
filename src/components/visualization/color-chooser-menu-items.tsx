import { selectionColors, selectionColorLabels } from "@/helpers/config";
import { GeographySelection } from "@/helpers/selection";
import { Geography } from "@/helpers/types";

import { Circle, CircleCheckBig } from "lucide-react";
import { ContextMenuItem } from "@/components/ui/context-menu";

// Color chooser that allows users to select what color a selected geography will
// be assigned.
export default function ColorChooserMenuItems<G extends Geography>({
  geography,
  selection,
  setSelection,
}: {
  geography: G;
  selection: GeographySelection<G>;
  setSelection: (selection: GeographySelection<G>) => void;
}) {
  const isSelected = selection.geographies.includes(geography);

  return selectionColors
    .slice(0, selection.length + (isSelected ? 0 : 1))
    .map((color, colorIdx) => {
      const selected = selection.geographies[colorIdx] == geography;
      const Icon = selected ? CircleCheckBig : Circle;

      return (
        <ContextMenuItem
          key={colorIdx}
          disabled={selected}
          onSelect={() => {
            const newGeographies = [...selection.geographies];
            if (!isSelected) newGeographies.push(geography);
            const currentIdx = newGeographies.indexOf(geography);
            const currentId = newGeographies[colorIdx];
            setSelection(
              new GeographySelection(
                newGeographies.map((id: G, i: number) =>
                  i == colorIdx ? geography : i == currentIdx ? currentId : id,
                ),
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
