import { Box } from "@primer/react";
import { UnderlinePanels } from "@primer/react/experimental";
import { FilterIcon, IssueOpenedIcon } from "@primer/octicons-react";

import DimensionsSelect from "./dimensions-select";

export default function MapSidebar({}) {
  return (
    <UnderlinePanels aria-label="Select a tab">
      <UnderlinePanels.Tab icon={FilterIcon}>Filters</UnderlinePanels.Tab>
      <UnderlinePanels.Tab icon={IssueOpenedIcon}>Issues</UnderlinePanels.Tab>
      <UnderlinePanels.Panel>
        <Box padding="20px">
          <DimensionsSelect />
        </Box>
      </UnderlinePanels.Panel>
      <UnderlinePanels.Panel>
        <Box padding="20px">Issues</Box>
      </UnderlinePanels.Panel>
    </UnderlinePanels>
  );
}
