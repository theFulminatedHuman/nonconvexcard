/**
 * Static-export configuration.
 *
 * The site is deployed to GitHub Pages, which serves plain files from a CDN —
 * there is no Node server at runtime. Every route is therefore pre-rendered at
 * build time (`output: 'export'`).
 *
 * `NEXT_PUBLIC_BASE_PATH` lets the same build be published either at the root of
 * a user page (`https://<user>.github.io/`) or under a project sub-path
 * (`https://<user>.github.io/<repo>/`).
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  // GitHub Pages resolves `/foo/` to `/foo/index.html`; without trailing slashes
  // deep links 404.
  trailingSlash: true,
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // MDX compilation happens in the RSC render pass during `next build`.
    optimizePackageImports: ['katex'],
  },
};

export default nextConfig;
