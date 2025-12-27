import React from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";

export type CoreUserInviteProps = {
  appName: string;
  inviteeName: string;
  inviteUrl: string;
};

export const CoreUserInvite = ({
  appName,
  inviteeName,
  inviteUrl,
}: CoreUserInviteProps) => {
  return (
    <Html lang="en">
      <Head />
      <Preview>You're invited to {appName}</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", padding: "24px" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "600px",
          }}
        >
          <Text style={{ fontSize: "18px" }}>Hi {inviteeName},</Text>
          <Text style={{ color: "#4b5563" }}>
            You've been invited to {appName}.
          </Text>
          <Hr style={{ margin: "16px 0" }} />
          <Link
            href={inviteUrl}
            style={{
              display: "inline-block",
              backgroundColor: "#111827",
              color: "#ffffff",
              padding: "12px 16px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Accept invite
          </Link>
          <Text style={{ color: "#6b7280", fontSize: "12px" }}>
            If the button doesn't work, copy and paste this URL: {inviteUrl}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

CoreUserInvite.PreviewProps = {
  appName: "LaunchThat",
  inviteeName: "Jane Doe",
  inviteUrl: "https://launchthat.app/invite/abc123",
} satisfies CoreUserInviteProps;

export default CoreUserInvite;


