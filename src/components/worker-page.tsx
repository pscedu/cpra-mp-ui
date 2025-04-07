import { useEffect } from "react";
import { useSignal } from "@preact/signals-react";
import { useLocation, useNavigate } from "react-router";

import { LoaderCircle, TriangleAlert } from "lucide-react";

export default function WorkerPage({
  action,
  description: initialDescription,
  heading: initialHeading,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const description = useSignal(initialDescription);
  const heading = useSignal(initialHeading);
  const status = useSignal("working");

  useEffect(() => {
    action(location, navigate, { description, heading, status });
  }, []);

  return (
    <div className="flex h-screen">
      <div className="m-auto">
        {(status.value == "working" && <LoaderCircle />) || (
          <TriangleAlert size="large" />
        )}
        {heading.value && <h1>{heading.value}</h1>}
        {description.value && <p>{description.value}</p>}
      </div>
    </div>
  );
}
