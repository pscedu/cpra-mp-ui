import { selectionColors, selectionColorLabels } from "@/helpers/config";
import { GeographySelection } from "@/helpers/selection";

import { Circle, CircleCheckBig } from "lucide-react";
import { ContextMenuItem } from "@/components/ui/context-menu";
import { ContextMenuTarget } from "@/components/base-map-context-menu";

// Color chooser that allows users to select what color a selected geography will
// be assigned.
export default function BaseMapColorChooserMenuItems({
  selection,
  setSelection,
  target,
}: {
  selection: GeographySelection;
  setSelection: (selection: GeographySelection) => void;
  target: ContextMenuTarget;
}) {
  const { coordinate, index } = target;
  // Choosing a color moves the geography into that color's position, which
  // discards any legacy cell IDs along with it, so the positions offered are
  // those of the edited selection.
  const geographies = selection.editable().geographies;
  const isSelected = index >= 0;

  return selectionColors
    .slice(0, geographies.length + (isSelected ? 0 : 1))
    .map((color, colorIdx) => {
      const selected = isSelected && index === colorIdx;
      const Icon = selected ? CircleCheckBig : Circle;

      return (
        <ContextMenuItem
          key={colorIdx}
          disabled={selected}
          onSelect={() => {
            const result = [...geographies];
            // Swap the geography into the chosen color's position, displacing
            // whatever held it into the position the geography came from.
            const from = isSelected ? index : result.push(coordinate) - 1;
            result[from] = result[colorIdx];
            result[colorIdx] = coordinate;
            setSelection(new GeographySelection(result));
          }}
        >
          <Icon style={{ color: `#${color}` }} />{" "}
          {selectionColorLabels[colorIdx]}
        </ContextMenuItem>
      );
    });
}
