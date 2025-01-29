import { SplitPageLayout } from "@primer/react";
import NavBar from "./navbar";

export default function Layout({ children }) {
  return (
    <SplitPageLayout>
      <SplitPageLayout.Header padding="none">
        <NavBar />
      </SplitPageLayout.Header>
      {children}
    </SplitPageLayout>
  );
}

Layout.Pane = function ({ children }) {
  return (
    <SplitPageLayout.Pane position="start" aria-label="Pane">
      {children}
    </SplitPageLayout.Pane>
  );
};

Layout.Content = function ({
  children,
  padding = "normal",
  sx = {},
  width = "full",
}) {
  return (
    <SplitPageLayout.Content width={width} padding={padding} sx={sx}>
      {children}
    </SplitPageLayout.Content>
  );
};
