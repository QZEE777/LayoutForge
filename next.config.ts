import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["unpdf"],
  async redirects() {
    return [
      { source: "/formatter", destination: "/", permanent: true },
      { source: "/pricing", destination: "/#pricing", permanent: false },
      { source: "/description-generator", destination: "/", permanent: true },
      { source: "/description-generator-pdf", destination: "/", permanent: true },
      { source: "/keyword-research", destination: "/", permanent: true },
      { source: "/epub-maker", destination: "/", permanent: true },
      { source: "/tools/pdf-compress", destination: "/pdf-compress", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noai, noimageai",
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "",
  project: process.env.SENTRY_PROJECT || "",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
