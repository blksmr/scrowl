import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["md", "mdx", "tsx", "ts", "jsx", "js"],
  transpilePackages: ["next-mdx-remote"],
  output: "export",
  distDir: "dist",
};

export default withMDX(nextConfig);
