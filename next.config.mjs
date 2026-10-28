/** @type {import('next').NextConfig} */
const nextConfig = {
  // The marketing landing page is a self-contained static file in /public.
  async rewrites() {
    return { beforeFiles: [{ source: "/", destination: "/landing.html" }] };
  },
};

export default nextConfig;
