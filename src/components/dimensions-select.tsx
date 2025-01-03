import { usePortalState } from "../helpers/state";

import MultiSelect from "./multi-select";

export default function DimensionsSelect() {
  const {
    activeSelectDimensions,
    datasetItems,
    datasetSelectedItems,
    filterChoicesItems,
    filterChoicesSelectedItems,
    setDatasetSelectedItems,
    setFilterChoicesSelectedItems,
  } = usePortalState();

  return (
    <>
      <MultiSelect
        label="Select datasets"
        items={datasetItems.value}
        selectedItems={datasetSelectedItems.value}
        setSelectedItems={setDatasetSelectedItems}
      />
      {activeSelectDimensions.value.map((dimension, i) => (
        <MultiSelect
          label={`Select ${dimension.label.toLowerCase()}`}
          items={filterChoicesItems.value[i]}
          selectedItems={filterChoicesSelectedItems.value[i]}
          setSelectedItems={(items) =>
            setFilterChoicesSelectedItems(dimension.name, items)
          }
        />
      ))}
    </>
  );
}
