import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    /* config options here */
    // reactCompiler: true, // Temporarily disabled - causing hook ordering issues with Clerk
    async rewrites() {
        return [
            {
                source: '/api/v1/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/:path*`,
            }, // Proxy to backend API
        ];
    },
    experimental: {
        staleTimes: {
            dynamic: 30,
            static: 180,
        },
    },
};

export default nextConfig;
