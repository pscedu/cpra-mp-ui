import { usePortalState } from "../helpers/state";

import { Box, Spinner } from "@primer/react";
import { CheckCircleFillIcon } from "@primer/octicons-react";

import TimeSelect from "./time-select";

export default function MapControls() {
  const { mapFeatureValuesLoading, mapTilesLoading } = usePortalState();
  const dataLoading = mapFeatureValuesLoading.value || mapTilesLoading.value;

  return (
    <Box
      sx={{
        backgroundColor: "canvas.subtle",
        borderColor: "border.default",
        borderStyle: "solid",
        borderWidth: 1,
        display: "flex",
        flexDirection: "row",
        left: "15px",
        p: 2,
        position: "absolute",
        top: "15px",
        width: "calc(100% - 30px)",
      }}
    >
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
    </Box>
  );
}
