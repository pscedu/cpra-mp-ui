import { Ref } from "react";
import { Geography } from "@/helpers/types";
import { GeographySelection } from "@/helpers/selection";
import { Map as GLMap } from "maplibre-gl";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuLabel,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import BaseMapColorChooserMenuItems from "@/components/base-map-color-chooser-menu-items";

export default function BaseMapContextMenu<G extends Geography>({
  children,
  geography,
  map,
  maxSelectedGeographies,
  selection,
  setGeography,
  setSelection,
  triggerRef,
}: {
  children: React.ReactNode;
  geography: G | null;
  map: GLMap | null;
  maxSelectedGeographies: number;
  selection: GeographySelection<G>;
  setGeography: (geography: G | null) => void;
  setSelection: (selection: GeographySelection<G>) => void;
  triggerRef: Ref<HTMLDivElement>;
}) {
  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (!open) setGeography(null);
      }}
    >
      <ContextMenuTrigger ref={triggerRef}>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {geography && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger inset>
                Select {map?.getGlobalState()?.grid?.label || "polygon"}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuLabel>Choose outline color</ContextMenuLabel>
                <BaseMapColorChooserMenuItems
                  geography={geography}
                  selection={selection}
                  setSelection={setSelection}
                />
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem
          disabled={!selection.length}
          onSelect={() => setSelection(new GeographySelection())}
        >
          <X /> Clear selection
          <ContextMenuShortcut>Esc</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!selection.length}
          onSelect={() => setSelection(selection.rotate(-1))}
        >
          <ChevronLeft /> Previous selection
          <ContextMenuShortcut>Ctrl &larr;</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!selection.length}
          onSelect={() => setSelection(selection.rotate(1))}
        >
          <ChevronRight /> Next selection
          <ContextMenuShortcut>Ctrl &rarr;</ContextMenuShortcut>
        </ContextMenuItem>
        {maxSelectedGeographies > 1 && (
          <>
            <ContextMenuItem
              disabled={selection.length <= maxSelectedGeographies}
              onSelect={() =>
                setSelection(selection.rotate(-1 * maxSelectedGeographies))
              }
            >
              <ChevronsLeft /> Previous {maxSelectedGeographies} selections
              <ContextMenuShortcut>Ctrl &uarr;</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem
              disabled={selection.length <= maxSelectedGeographies}
              onSelect={() =>
                setSelection(selection.rotate(maxSelectedGeographies))
              }
            >
              <ChevronsRight /> Next {maxSelectedGeographies} selections
              <ContextMenuShortcut>Ctrl &darr;</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
