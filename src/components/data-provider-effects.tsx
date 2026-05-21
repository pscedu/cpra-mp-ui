import { ReactNode } from "react";
import { useAtom } from "jotai";
import {
  queryCatlogEffect,
  updateMaxSelectedGeographiesEffect,
} from "@/helpers/state";

export default function DataProviderEffects({
  children,
}: {
  children: ReactNode;
}) {
  useAtom(queryCatlogEffect);
  useAtom(updateMaxSelectedGeographiesEffect);
  return children;
}
