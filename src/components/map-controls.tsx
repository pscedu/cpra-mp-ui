import { usePortalState } from "../helpers/state";

import { Box, Spinner } from "@primer/react";
import { CheckCircleFillIcon } from "@primer/octicons-react";

import TimeSelect from "./time-select";
import FloatingPanel from "./floating-panel";

export default function MapControls() {
  const { mapFeatureValuesLoading, mapTilesLoading } = usePortalState();
  const dataLoading = mapFeatureValuesLoading.value || mapTilesLoading.value;

  return (
    <FloatingPanel position="top" padding={2}>
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          width: "2rem",
        }}
      >
        {dataLoading ? (
          <Spinner size="small" />
        ) : (
          <CheckCircleFillIcon size={16} />
        )}
      </Box>
      <TimeSelect />
    </FloatingPanel>
  );
}
