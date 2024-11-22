import { Header } from "@primer/react";

export default function NavBar() {
  return (
    <Header>
      <Header.Item>
        <Header.Link
          href="#"
          sx={{
            fontSize: 2,
          }}
        >
          <span>CPRA Master Plan Data Portal</span>
        </Header.Link>
      </Header.Item>
    </Header>
  );
}
