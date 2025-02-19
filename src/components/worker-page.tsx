import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { useLocation } from "preact-iso";
import { usePortalState } from "../helpers/state";

import { AlertIcon } from "@primer/octicons-react";
import { Spinner } from "@primer/react";
import { Blankslate } from "@primer/react/experimental";

import Layout from "./layout";

export default function WorkerPage({
  action,
  description: initialDescription,
  heading: initialHeading,
}) {
  const location = useLocation();
  const state = usePortalState();
  const description = useSignal(initialDescription);
  const heading = useSignal(initialHeading);
  const status = useSignal("working");

  useEffect(() => {
    action(location, state, { description, heading, status });
  }, []);

  return (
    <Layout>
      <Layout.Content>
        <Blankslate>
          <Blankslate.Visual>
            {(status.value == "working" && <Spinner />) || (
              <AlertIcon size="large" />
            )}
          </Blankslate.Visual>
          {heading.value && (
            <Blankslate.Heading>{heading.value}</Blankslate.Heading>
          )}
          {description.value && (
            <Blankslate.Description>{description.value}</Blankslate.Description>
          )}
        </Blankslate>
      </Layout.Content>
    </Layout>
  );
}
