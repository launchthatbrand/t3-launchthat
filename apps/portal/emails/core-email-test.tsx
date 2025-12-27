import React from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";

export type CoreEmailTestProps = {
  appName: string;
  orgName: string;
  sentAt: string;
};

export const CoreEmailTest = ({ appName, orgName, sentAt }: CoreEmailTestProps) => {
  return (
    <Html lang="en">
      <Head />
      <Preview>
        Test email from {appName} ({orgName})
      </Preview>
      <Body style={{ backgroundColor: "#f6f9fc", padding: "24px" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "600px",
          }}
        >
          <Text style={{ fontSize: "18px" }}>Test email</Text>
          <Text style={{ color: "#4b5563" }}>
            This is a test email from {appName}.
          </Text>
          <Hr style={{ margin: "16px 0" }} />
          <Text style={{ color: "#111827" }}>Organization: {orgName}</Text>
          <Text style={{ color: "#111827" }}>Sent at: {sentAt}</Text>
        </Container>
      </Body>
    </Html>
  );
};

CoreEmailTest.PreviewProps = {
  appName: "LaunchThat",
  orgName: "Wall Street Academy",
  sentAt: new Date().toISOString(),
} satisfies CoreEmailTestProps;

export default CoreEmailTest;


