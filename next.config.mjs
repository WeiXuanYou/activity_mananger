/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Image uploads run through a Server Action (uploadImageAction),
      // which enforces its own 5 MB-per-file cap. Next.js, however,
      // rejects ANY Server Action request body over 1 MB BEFORE our code
      // runs — so a 2 MB phone photo failed silently with a cryptic
      // "Body exceeded 1mb limit" before reaching the size check.
      //
      // Bump the framework limit above our per-file cap (5 MB) with
      // headroom for multipart overhead + the inline base64 avatar
      // (~700 KB encoded). 8 MB keeps us safe without inviting abuse.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
