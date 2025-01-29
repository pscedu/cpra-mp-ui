import { launchGravatarEditor } from "../helpers/avatar";
import { usePortalState } from "../helpers/state";

import { ActionList, PageHeader, PageLayout, Token } from "@primer/react";
import { CommentIcon, MailIcon, PersonIcon } from "@primer/octicons-react";

import Avatar from "./avatar";
import Layout from "./layout";

export default function ProfilePage() {
  const { avatarCacheKey, user } = usePortalState();

  const userInfo = [
    [PersonIcon, "Username", user.value.username],
    [MailIcon, "Email", user.value.email],
  ];

  return (
    <Layout>
      <Layout.Content>
        <PageLayout>
          <PageLayout.Header>
            <PageHeader role="banner" aria-label="Title">
              <PageHeader.TitleArea variant="large">
                <PageHeader.Title>{user.value.name}</PageHeader.Title>
              </PageHeader.TitleArea>
              <PageHeader.Description>
                {userInfo.map(([Icon, label, value], i) => (
                  <Token
                    key={i}
                    title={label}
                    text={value}
                    leadingVisual={Icon}
                  />
                ))}
              </PageHeader.Description>
            </PageHeader>
          </PageLayout.Header>
          <PageLayout.Content>
            <ActionList>
              <ActionList.Item
                onSelect={() =>
                  launchGravatarEditor(user.value.email, () => {
                    avatarCacheKey.value = new Date().getTime();
                  })
                }
              >
                <ActionList.LeadingVisual>
                  <Avatar />
                </ActionList.LeadingVisual>
                Edit avatar
              </ActionList.Item>
              <ActionList.Item>
                <ActionList.LeadingVisual>
                  <CommentIcon />
                </ActionList.LeadingVisual>
                Link ClickUp account
              </ActionList.Item>
            </ActionList>
          </PageLayout.Content>
        </PageLayout>
      </Layout.Content>
    </Layout>
  );
}
