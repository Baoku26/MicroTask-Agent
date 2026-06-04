import { ethers, network } from "hardhat";

const CUSD_MAINNET  = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
const CUSD_TESTNET  = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "CELO");

  const cUSDAddress = network.name === "celo" ? CUSD_MAINNET : CUSD_TESTNET;
  console.log("Network:", network.name);
  console.log("cUSD address:", cUSDAddress);

  const MicroTaskPayment = await ethers.getContractFactory("MicroTaskPayment");
  const contract = await MicroTaskPayment.deploy(cUSDAddress);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\nMicroTaskPayment deployed to:", address);
  console.log("\nNext steps:");
  console.log(`  npx hardhat verify --network ${network.name} ${address} ${cUSDAddress}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
