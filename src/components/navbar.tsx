import { loginUrl } from "../helpers/config";
import { usePortalState } from "../helpers/state";

import { Button, Header } from "@primer/react";
import UserMenu from "./user-menu";

export default function NavBar() {
  const { user } = usePortalState();
  return (
    <Header>
      <Header.Item>
        <Header.Link
          href="/"
          sx={{
            fontSize: 2,
          }}
        >
          CPRA Master Plan Data Portal
        </Header.Link>
      </Header.Item>
      <Header.Item>
        <Header.Link href="/">Data</Header.Link>
      </Header.Item>
      <Header.Item full>
        <Header.Link href="/simulations">Simulations</Header.Link>
      </Header.Item>

      <Header.Item sx={{ mr: 0 }}>
        {user.value ? (
          <UserMenu />
        ) : (
          <Button as="a" variant="invisible" href={loginUrl}>
            Login
          </Button>
        )}
      </Header.Item>
    </Header>
  );
}
