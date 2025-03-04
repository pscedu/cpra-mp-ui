import { Box } from "@primer/react";

export default function FloatingPanel({
  children,
  padding = 3,
  position = "bottom",
}) {
  const sx = {
    backgroundColor: "canvas.subtle",
    borderColor: "border.default",
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "row",
    left: "15px",
    p: padding,
    position: "absolute",
    width: "calc(100% - 30px)",
  };

  sx[position] = "15px";

  return <Box sx={sx}>{children}</Box>;
}
