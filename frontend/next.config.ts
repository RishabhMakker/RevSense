import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // The diagnostic core lives in ../backend as a workspace package that ships
  // raw TypeScript; Next compiles it as part of the app build.
  transpilePackages: ["@revsense/backend"],
  // Point file tracing at the monorepo root so Vercel bundles the workspace
  // dependency correctly when the project root is set to /frontend.
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
