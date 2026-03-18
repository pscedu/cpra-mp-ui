import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import DownloadDropdown from "./download-dropdown";

export default function DownloadSidebar() {
  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <DownloadDropdown />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
