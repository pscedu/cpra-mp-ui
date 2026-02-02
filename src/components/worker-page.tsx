import { useEffect } from "react";
import { atom, useAtom, useSetAtom } from "jotai";
import { useLocation, useNavigate } from "react-router";
import { completeLoginAtom, linkClickupAtom } from "@/helpers/state";

import { LoaderCircle, TriangleAlert } from "lucide-react";

const descriptionAtom = atom("");
const headingAtom = atom("Completing login...");
const statusAtom = atom("working");

export default function WorkerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [description, setDescription] = useAtom(descriptionAtom);
  const [heading, setHeading] = useAtom(headingAtom);
  const [status, setStatus] = useAtom(statusAtom);
  const completeLogin = useSetAtom(completeLoginAtom);
  const linkClickup = useSetAtom(linkClickupAtom);

  useEffect(() => {
    // Determine which action to call based on the path
    if (location.pathname === "/callback/login") {
      completeLogin({
        search: location.search,
        navigate,
        status: {
          description: atom(null, (get, set, value) => setDescription(value)),
          heading: atom(null, (get, set, value) => setHeading(value)),
          status: atom(null, (get, set, value) => setStatus(value)),
        },
      });
    } else if (location.pathname === "/callback/clickup") {
      linkClickup({ search: location.search, navigate });
    }
  }, []);

  return (
    <div className="flex h-screen">
      <div className="m-auto">
        {(status === "working" && (
          <LoaderCircle size="large" className="animate-spin" />
        )) || <TriangleAlert size="large" />}
        {heading && <h1>{heading}</h1>}
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}
