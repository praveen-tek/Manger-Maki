import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const basePath = isGithubActions ? "/Manger-Maki" : "";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "out",
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(isGithubActions && {
    basePath,
    assetPrefix: `${basePath}/`,
  }),
};

export default nextConfig;