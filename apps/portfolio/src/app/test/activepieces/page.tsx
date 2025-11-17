"use client";

import Script from "next/script";

const Page = () => {
  const instanceUrl = "https://localhost:4200";
  const jwtToken = "GENERATED_JWT_TOKEN";
  const containerId = "activepieces-container";
  return (
    <>
      <div id={containerId} />
      <Script
        src="https://cdn.activepieces.com/sdk/embed/0.4.0.js"
        strategy="afterInteractive"
      />
      <Script id="activepieces-init" strategy="afterInteractive">{`
      (function () {
        var instanceUrl = '${instanceUrl}';
        var jwtToken = '${jwtToken}';
        var containerId = '${containerId}';
        if (window.activepieces && typeof window.activepieces.configure === 'function') {
          window.activepieces.configure({
            instanceUrl: instanceUrl,
            jwtToken: jwtToken,
            prefix: "/",
            embedding: {
              containerId: containerId,
              builder: {
                disableNavigation: false,
                hideFlowName: false
              },
              dashboard: {
                hideSidebar: false
              },
              hideFolders: false,
              navigation: {
                handler: function ({ route }) {
                  // The iframe route has changed, make sure you check the navigation section.
                }
              }
            },
          });
        }
      })();
    `}</Script>
    </>
  );
};

export default Page;
