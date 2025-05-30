import { Email } from "../types";

// Simplified HTML content to avoid loading issues for now
const truncatedEmailHtml = `
<html>
  <body>
    <h1>FW: Target ZERO Tips Tuesday</h1>
    <p>Good afternoon, everyone,</p>
    <p><b>April is National Distracted Driving Awareness Month!</b></p>
    <p>This month is a perfect opportunity to focus on one of the most preventable risks on our roads...</p>
    <p>Erin</p>
  </body>
</html>
`;

export const sampleEmails: Email[] = [
  {
    id: "1",
    subject: "FW: Target ZERO Tips Tuesday",
    sender: "Dawn Moliterno <Dawn.Moliterno@qcausa.com>",
    html: truncatedEmailHtml,
  },
  // Add more emails as needed
];
