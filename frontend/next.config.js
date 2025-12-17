/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

//   images: {
//   domains: [
//     "daulat-nft-marketplace.infura-ipfs.io", "infura-ipfs.io"
//   ],
// }
images: {
  domains: [
    "gateway.pinata.cloud",
    "ipfs.io",
    "cloudflare-ipfs.com",
  ],
},

}


module.exports = nextConfig
