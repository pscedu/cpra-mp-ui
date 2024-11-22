import { usePortalState } from "../helpers/state";

import MultiSelect from "./multi-select";

export default function DimensionsSelect() {
  const { datasetItems, datasetSelectedItems, setDatasetSelectedItems } =
    usePortalState();

  return (
    <>
      <MultiSelect
        label="Select datasets"
        items={datasetItems.value}
        selectedItems={datasetSelectedItems.value}
        setSelectedItems={setDatasetSelectedItems}
      />
    </>
  );
}
