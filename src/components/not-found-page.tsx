import { Blankslate } from "@primer/react/experimental";
import { AlertIcon } from "@primer/octicons-react";

import Layout from "./layout";

export default function NotFoundPage() {
  return (
    <Layout>
      <Layout.Content>
        <Blankslate>
          <Blankslate.Visual>
            <AlertIcon size="large" />
          </Blankslate.Visual>
          <Blankslate.Heading>Page Not Found</Blankslate.Heading>
          <Blankslate.Description>
            Sorry, we couldn't find anything at that location.
          </Blankslate.Description>
          <Blankslate.PrimaryAction href="/">Go Home</Blankslate.PrimaryAction>
        </Blankslate>
      </Layout.Content>
    </Layout>
  );
}
