import { useTheme } from "@primer/react";
import { VegaLite } from "react-vega";
import { dark, excel } from "vega-themes";

const darkTheme = { ...dark, background: "#161b22" };
const lightTheme = excel;

export default function Visualization({ spec }) {
  const theme = useTheme();

  return (
    <VegaLite
      spec={spec}
      style={{ width: "100%" }}
      config={theme.colorScheme === "dark" ? darkTheme : lightTheme}
    />
  );
}
