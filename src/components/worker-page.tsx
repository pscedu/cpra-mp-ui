import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAtom } from "jotai";
import { workerPageAtom } from "@/helpers/state";

import { LoaderCircle, TriangleAlert } from "lucide-react";

export default function WorkerPage({
  action,
  description: initialDescription,
  heading: initialHeading,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [{ description, heading, status }, setWorkerPage] =
    useAtom(workerPageAtom);

  useEffect(() => {
    setWorkerPage({
      description: initialDescription,
      heading: initialHeading,
      status: "working",
    });
    action(location, navigate);
  }, []);

  return (
    <div className="flex h-screen">
      <div className="m-auto">
        {(status == "working" && (
          <LoaderCircle size="large" className="animate-spin" />
        )) || <TriangleAlert size="large" />}
        {heading && <h1>{heading}</h1>}
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}
