import { useLocation } from "preact-iso";
import { usePortalState } from "../helpers/state";

import { ActionList, ActionMenu } from "@primer/react";

import Avatar from "./avatar";

export default function UserMenu() {
  const { user } = usePortalState();
  const { route } = useLocation();
  const avatar = <Avatar />;
  return (
    <ActionMenu>
      <ActionMenu.Button
        variant="invisible"
        sx={{ pt: 0, pb: 0 }}
        leadingVisual={avatar}
      >
        {user.value.name}
      </ActionMenu.Button>
      <ActionMenu.Overlay width="small">
        <ActionList>
          <ActionList.Item onSelect={() => route("/profile")}>
            Profile
          </ActionList.Item>
          <ActionList.Divider />
          <ActionList.Item
            onSelect={() => {
              route("/");
              user.value = null;
            }}
          >
            Logout
          </ActionList.Item>
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}
