import { useTheme } from "@/components/theme-provider";
import { VegaLite } from "react-vega";
import { dark, excel } from "vega-themes";

const darkTheme = { ...dark, background: "#161b22" };
const lightTheme = excel;

export default function Visualization({ spec }) {
  const theme = useTheme();

  return (
    <VegaLite
      actions={false}
      spec={spec}
      style={{ width: "calc(100% - 32px)" }}
      padding={16}
      config={theme.theme === "dark" ? darkTheme : lightTheme}
    />
  );
}
