/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração de proxy para o backend
  async rewrites() {
    return [
      {
        source: '/zabbix/:path*',
        destination: 'http://127.0.0.1:8002/zabbix/:path*',
      },
      {
        source: '/chat/:path*',
        destination: 'http://127.0.0.1:8002/chat/:path*',
      },
    ];
  },

  // Redirecionamento permanente
  async redirects() {
    return [
      {
        source: '/empresas',
        destination: '/dashboard/companies',
        permanent: true,
      },
    ];
  },

  // Configuração de imagens externas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;