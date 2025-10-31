/** @type {import('next').NextConfig} */
const nextConfig = {
    // SOLUÇÃO PARA A IMAGEM DE PERFIL
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**',
      },
    ],
  },
};

export default nextConfig;