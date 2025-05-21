
import type {NextConfig} from 'next';

// Helper function to parse hostname from URL - No longer needed for dynamic cloud URL
// const getHostnameFromUrl = (url?: string): string | null => {
//   if (!url) return null;
//   try {
//     const parsedUrl = new URL(url);
//     return parsedUrl.hostname;
//   } catch (error) {
//     console.error("Invalid URL for image hostname:", url, error);
//     return null;
//   }
// };

// const imageCloudHostname = getHostnameFromUrl(process.env.NEXT_PUBLIC_IMAGE_CLOUD_BASE_URL);

const remotePatternsConfig = [
  {
    protocol: 'https',
    hostname: 'placehold.co',
    port: '',
    pathname: '/**',
  },
];

// if (imageCloudHostname) {
//   remotePatternsConfig.push({
//     protocol: imageCloudHostname.startsWith('localhost') ? 'http' : 'https', // Allow http for localhost development
//     hostname: imageCloudHostname,
//     port: '',
//     pathname: '/**',
//   });
// }


const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: remotePatternsConfig,
  },
};

export default nextConfig;
