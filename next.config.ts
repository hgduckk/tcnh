import type {NextConfig} from 'next';

const supabaseHostname = (() => {
  try {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!raw) return null;
    return new URL(raw).hostname;
  } catch {
    return null;
  }
})();

// Corporate SSL inspection proxy fix: Node.js doesn't use the Windows cert store,
// so TLS verification fails on internal networks. Only disabled in development.
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  productionBrowserSourceMaps: false,
  serverExternalPackages: ['sharp'],
  onDemandEntries: {
    maxInactiveAge: 60000,
    pagesBufferLength: 5,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      ...(supabaseHostname
        ? [
            {
              protocol: 'https' as const,
              hostname: supabaseHostname,
              port: '',
              pathname: '/**',
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
