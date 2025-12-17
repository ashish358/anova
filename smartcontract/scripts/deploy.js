const hre = require("hardhat");

async function main() {
  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy();

  // Wait for deployment (ethers v6)
  await marketplace.waitForDeployment();

  // Get deployed contract address (ethers v6)
  const address = await marketplace.getAddress();

  console.log("✅ NFTMarketplace deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error during deployment:", error);
    process.exit(1);
  });
