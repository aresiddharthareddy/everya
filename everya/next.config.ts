import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/r/:username/:repo",
        destination: "/u/:username/trace/:repo",
        permanent: true,
      },
      {
        source: "/r/:username/:repo/new",
        destination: "/u/:username/trace/:repo/new",
        permanent: true,
      },
      {
        source: "/r/:username/:repo/:doc",
        destination: "/u/:username/trace/:repo/:doc",
        permanent: true,
      },
      {
        source: "/r/:username/:repo/:doc/edit",
        destination: "/u/:username/trace/:repo/:doc/edit",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/EVERYA-offline.apk",
        headers: [
          { key: "Content-Type", value: "application/vnd.android.package-archive" },
          { key: "Content-Disposition", value: 'attachment; filename="EVERYA-offline.apk"' },
        ],
      },
    ];
  },
};

export default nextConfig;
