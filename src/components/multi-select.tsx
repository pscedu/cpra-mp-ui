import { useSignal } from "@preact/signals";
import { TriangleDownIcon } from "@primer/octicons-react";

import { Button, SelectPanel } from "@primer/react";

export default function MultiSelect({
  items,
  label,
  placeholder = null,
  selectedItems,
  setSelectedItems,
}) {
  const filter = useSignal("");
  const open = useSignal(false);

  const filteredItems = items.filter((item) =>
    item.text?.toLowerCase().startsWith(filter.value.toLowerCase())
  );

  return (
    <>
      <SelectPanel
        title={label}
        // subtitle="Description"
        renderAnchor={({
          children,
          "aria-labelledby": ariaLabelledBy,
          ...anchorProps
        }) => (
          <Button
            trailingAction={TriangleDownIcon}
            aria-labelledby={` ${ariaLabelledBy}`}
            {...anchorProps}
            aria-haspopup="dialog"
            sx={{
              marginBottom: 2,
            }}
          >
            <span
              style={{
                display: "inline-block",
                minWidth: "0",
                maxWidth: "275px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {children ?? label}
            </span>
          </Button>
        )}
        placeholderText={placeholder || "Filter items"}
        open={open.value}
        onOpenChange={(value) => (open.value = value)}
        items={filteredItems}
        selected={selectedItems.length ? selectedItems[0] : null}
        onSelectedChange={(item) => setSelectedItems([item])}
        onFilterChange={(value) => (filter.value = value)}
        overlayProps={{
          width: "small",
          maxHeight: "large",
        }}
      />
    </>
  );
}
