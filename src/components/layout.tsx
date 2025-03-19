import { PageLayout } from "@primer/react";
import NavBar from "./navbar";

export default function Layout({ children }) {
  return (
    <PageLayout
      columnGap="none"
      containerWidth="full"
      padding="none"
      rowGap="none"
    >
      <PageLayout.Header padding="none" divider="line">
        <NavBar />
      </PageLayout.Header>
      {children}
    </PageLayout>
  );
}

Layout.Pane = function ({ children }) {
  return (
    <PageLayout.Pane
      padding="none"
      position="start"
      aria-label="Pane"
      width={{ min: "360px", max: "360px", default: "360px" }}
    >
      {children}
    </PageLayout.Pane>
  );
};

Layout.Content = function ({
  children,
  padding = "normal",
  sx = {},
  width = "full",
}) {
  return (
    <PageLayout.Content width={width} padding={padding} sx={sx}>
      {children}
    </PageLayout.Content>
  );
};
