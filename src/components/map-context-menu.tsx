import { useRef, useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  contextMenuAtom,
  catalogQueriesAtom,
  rotateSelectedGeographiesAtom,
  selectedGeographiesAtom,
  visualizationAtom,
} from "@/helpers/state";
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
import ColorChooserMenuItems from "@/components/color-chooser-menu-items";

export default function MapContextMenu({
  children,
}: {
  children: React.ReactNode;
}) {
  const contextMenu = useAtomValue(contextMenuAtom);
  const selectedGeographies = useAtomValue(selectedGeographiesAtom);
  const visualization = useAtomValue(visualizationAtom);
  const mapCatalogQuery = useAtomValue(catalogQueriesAtom).getMapCatalogQuery();
  const rotateSelectedGeographies = useSetAtom(rotateSelectedGeographiesAtom);
  const trigger = useRef<HTMLDivElement>(null);

  const geography = contextMenu?.geography;
  const selectionCount = selectedGeographies?.length;
  const maxGeographies = visualization.max_geographies || 10;

  useEffect(() => {
    if (
      contextMenu &&
      contextMenu?.type === "geography-select" &&
      trigger.current
    ) {
      const { x, y } = contextMenu;
      trigger.current.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          clientX: x,
          clientY: y,
        }),
      );
    }
  }, [contextMenu]);

  const setContextMenu = useSetAtom(contextMenuAtom);
  const setSelectedGeographies = useSetAtom(selectedGeographiesAtom);

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (!open) setContextMenu(null);
      }}
    >
      <ContextMenuTrigger ref={trigger}>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {geography && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger inset>
                Select {mapCatalogQuery?.dataset.grid.label.toLowerCase()}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuLabel>Choose outline color</ContextMenuLabel>
                <ColorChooserMenuItems geography={geography} />
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem
          disabled={!selectionCount}
          onSelect={() => setSelectedGeographies([])}
        >
          <X /> Clear selection
          <ContextMenuShortcut>Esc</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!selectionCount}
          onSelect={() => rotateSelectedGeographies(-1)}
        >
          <ChevronLeft /> Previous selection
          <ContextMenuShortcut>Ctrl &larr;</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!selectionCount}
          onSelect={() => rotateSelectedGeographies(1)}
        >
          <ChevronRight /> Next selection
          <ContextMenuShortcut>Ctrl &rarr;</ContextMenuShortcut>
        </ContextMenuItem>
        {maxGeographies > 1 && (
          <>
            <ContextMenuItem
              disabled={selectionCount <= maxGeographies}
              onSelect={() => rotateSelectedGeographies(-1 * maxGeographies)}
            >
              <ChevronsLeft /> Previous {maxGeographies} selections
              <ContextMenuShortcut>Ctrl &uarr;</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem
              disabled={selectionCount <= maxGeographies}
              onSelect={() => rotateSelectedGeographies(maxGeographies)}
            >
              <ChevronsRight /> Next {maxGeographies} selections
              <ContextMenuShortcut>Ctrl &darr;</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
